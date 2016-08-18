package job

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/Sirupsen/logrus"
	"github.com/coreos/go-quay/quay"
	"github.com/coreos/go-quay/quay/organization"
	"github.com/coreos/go-quay/quay/robot"
	"github.com/coreos/go-quay/quay/team"
	"github.com/coreos/pkg/multierror"
	"github.com/coreos/pkg/timeutil"
	"github.com/go-openapi/runtime"
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"

	"github.com/coreos-inc/soy/common/pubsub"
	quaycommon "github.com/coreos-inc/soy/common/quay"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/event"
	"github.com/coreos-inc/soy/manager"
	pb "github.com/coreos-inc/soy/proto"
	"github.com/coreos-inc/soy/server"
)

const quayAccountLockSuffix = "sync_quay_account"

type QuayConfig struct {
	APIKey       string
	Organization string
	Prefix       string
}

type QuayRuntime struct {
	QuayClient *quay.Client
	QuayAuth   runtime.ClientAuthInfoWriter

	AccountClient pb.AccountServiceClient
	Context       context.Context
	RPCTimeout    time.Duration
	DB            db.DB

	Logger *logrus.Entry
}

type QuayAccountJobHandler struct {
	Config  QuayConfig
	Runtime *QuayRuntime
	DryRun  bool

	ratePlanToTeam map[string][]string
	mu             sync.Mutex
	startWatcher   sync.Once
}

func (handler *QuayAccountJobHandler) HandleJob(msg *pubsub.Message) error {
	var err error
	handler.startWatcher.Do(func() {
		md := metadata.Pairs(server.SkipAuthKey, "true")
		authCtx := metadata.NewContext(handler.Runtime.Context, md)

		// Do the initial request, and then begin monitoring after
		if err = handler.getPlanTeamMapping(authCtx); err != nil {
			handler.Runtime.Logger.WithError(err).Warnf("unable to get initial rate plan to team mapping")
			return
		}
		go handler.monitorProducts(authCtx)
	})
	if err != nil {
		return err
	}

	var ev event.AccountEvent
	err = json.Unmarshal(msg.Data, &ev)
	if err != nil {
		return err
	}

	lockID := ev.BFAccountID + quayAccountLockSuffix
	return db.WithAdvisoryLock(lockID, handler.Runtime.DB, func(_ db.Queryer) error {
		return handler.doJob(ev.BFAccountID)
	})
}

func (handler *QuayAccountJobHandler) doJob(accountID string) error {
	var robotName, fullRobotName, token string
	organizationName := handler.Config.Organization

	quayLogger := handler.Runtime.Logger.WithFields(logrus.Fields{
		"job":       "QuayAccountJob",
		"accountID": accountID,
	})

	md := metadata.Pairs(server.SkipAuthKey, "true")
	authCtx := metadata.NewContext(handler.Runtime.Context, md)
	ctx, _ := context.WithTimeout(authCtx, handler.Runtime.RPCTimeout)

	quayResp, err := handler.Runtime.AccountClient.GetQuayCredentials(ctx, &pb.GetQuayCredentialsReq{
		AccountID: accountID,
	})
	if grpc.Code(err) == codes.NotFound {
		robotName = quaycommon.NormalizeIdentifier(handler.Config.Prefix, accountID)
		if !quaycommon.ValidIdentifier(robotName) {
			return fmt.Errorf("Invalid quay identifier %s", robotName)
		}
	} else if err != nil {
		return err
	} else {
		fullRobotName = quayResp.QuayID
		token = quayResp.QuayToken
		parts := strings.SplitN(fullRobotName, "+", 2)
		organizationName = parts[0]
		if organizationName != handler.Config.Organization {
			quayLogger.Warnf("configured org differ from robot organization: %s, configured organization: %s, ending job early", organizationName, handler.Config.Organization)
			return nil
		}
		robotName = parts[1]
	}

	quayLogger = quayLogger.WithFields(logrus.Fields{
		"organization": organizationName,
		"robotName":    robotName,
	})

	fullRobotName, token, err = handler.getOrCreateOrgRobot(quayLogger, organizationName, robotName)
	if err != nil {
		return err
	}

	// We do this early as possible in the job to ensure the quayID is set
	// when the robot account gets created. if it's already been created/set
	// this is a no-op
	quayLogger.Debug("setting quayID on account")
	ctx, _ = context.WithTimeout(authCtx, handler.Runtime.RPCTimeout)
	_, err = handler.Runtime.AccountClient.SetQuayCredentials(handler.Runtime.Context, &pb.SetQuayCredentialsReq{
		AccountID: accountID,
		QuayID:    fullRobotName,
		QuayToken: token,
	})
	if err != nil {
		if grpc.Code(err) == codes.AlreadyExists {
			quayLogger.Info("quayID already exists on account")
		} else {
			quayLogger.WithError(err).Error("unable to set quayID on account, unexpected error occurred")
		}
	}

	quayLogger.Debug("beginning to sync quay teams")
	// Sync the quay teams next
	var (
		addTeams, removeTeams []string
		desiredTeams          = make(map[string]struct{})
		currentTeams          = make(map[string]struct{})
	)

	quayLogger.Debug("getting robots teams")
	memberResp, err := handler.Runtime.QuayClient.Organization.GetOrganizationMember(&organization.GetOrganizationMemberParams{
		Orgname:    organizationName,
		Membername: fullRobotName,
	}, handler.Runtime.QuayAuth)
	if err != nil {
		if _, ok := err.(*organization.GetOrganizationMemberNotFound); ok {
			// not found can mean the robot has zero teams, so continue, since
			// we know the robot exists, just continue on.

			// Intentially left empty.
			quayLogger.Debug("robot has no teams")
		} else {
			return err
		}
	} else {
		for _, team := range memberResp.Payload.Teams {
			currentTeams[*team.Name] = struct{}{}
		}
	}

	ctx, _ = context.WithTimeout(authCtx, handler.Runtime.RPCTimeout)
	subsResp, err := handler.Runtime.AccountClient.ListSubscriptions(ctx, &pb.ListSubscriptionsReq{
		AccountID:      accountID,
		IncludeRetired: false,
	})
	if err != nil {
		return err
	}

	handler.mu.Lock()
	for _, sub := range subsResp.GetChildren() {
		// Only active subscriptions should add to the desired teams
		if manager.IsActiveSubscription(sub) {
			teams := handler.ratePlanToTeam[sub.ProductRatePlanID]
			for _, team := range teams {
				desiredTeams[team] = struct{}{}
			}
		}
	}
	handler.mu.Unlock()

	for team := range currentTeams {
		// Not in the desired teams, remove it
		if _, exists := desiredTeams[team]; !exists {
			removeTeams = append(removeTeams, team)
		}
	}
	for team := range desiredTeams {
		// Not in the current set of teams, but should be, add it
		if _, exists := currentTeams[team]; !exists {
			addTeams = append(addTeams, team)
		}
	}

	var (
		desiredList []string
		currentList []string
	)
	for t := range desiredTeams {
		desiredList = append(desiredList, t)
	}
	for t := range currentTeams {
		currentList = append(currentList, t)
	}

	quayLogger.Debugf("current quay teams: %s", strings.Join(currentList, ","))
	quayLogger.Debugf("desired quay teams: %s", strings.Join(desiredList, ","))

	var errs multierror.Error

	if len(addTeams) == 0 {
		quayLogger.Debug("no teams to add")
	} else {
		quayLogger.Infof("adding robot to teams: %s", strings.Join(addTeams, ","))
		for _, addTeam := range addTeams {
			quayLogger.Debugf("adding %s to team %s", fullRobotName, addTeam)
			if handler.DryRun {
				quayLogger.Debugf("DryRun is true, not actually adding to team")
				continue
			}
			_, err := handler.Runtime.QuayClient.Team.UpdateOrganizationTeamMember(&team.UpdateOrganizationTeamMemberParams{
				Orgname:    organizationName,
				Teamname:   addTeam,
				Membername: fullRobotName,
			}, handler.Runtime.QuayAuth)
			if err != nil {
				badReqErr, ok := err.(*team.UpdateOrganizationTeamMemberBadRequest)
				memberExists := ok && strings.Contains(badReqErr.Payload.ErrorMessage, "already a member")
				if !memberExists {
					errs = append(errs, err)
				}
			}
		}
	}

	if len(removeTeams) == 0 {
		quayLogger.Debug("no teams to remove")
	} else {
		quayLogger.Infof("removing robot from teams: %s", strings.Join(removeTeams, ","))
		for _, remTeam := range removeTeams {
			quayLogger.Debugf("removing %s from team %s", fullRobotName, remTeam)
			if handler.DryRun {
				quayLogger.Debugf("DryRun is true, not actually removing from team")
				continue
			}
			_, err := handler.Runtime.QuayClient.Team.DeleteOrganizationTeamMember(&team.DeleteOrganizationTeamMemberParams{
				Orgname:    organizationName,
				Teamname:   remTeam,
				Membername: fullRobotName,
			}, handler.Runtime.QuayAuth)
			if err != nil {
				badReqErr, ok := err.(*team.DeleteOrganizationTeamMemberBadRequest)
				notMember := ok && strings.Contains(badReqErr.Payload.ErrorMessage, "does not belong")
				if !notMember {
					errs = append(errs, err)
				}
			}
		}
	}

	err = errs.AsError()
	if err != nil {
		return err
	}

	return nil
}

func (handler *QuayAccountJobHandler) getOrCreateOrgRobot(quayLogger *logrus.Entry, organizationName, robotName string) (string, string, error) {
	var fullRobotName, token string

	quayLogger.Debug("checking if quay robot account exists")
	robotGetResp, err := handler.Runtime.QuayClient.Robot.GetOrgRobot(&robot.GetOrgRobotParams{
		Orgname:        organizationName,
		RobotShortname: robotName,
	}, handler.Runtime.QuayAuth)
	if err != nil {
		// if the error is anything other than the robot not being found,
		// than we should error out
		if !isRobotNotFoundErr(err) {
			quayLogger.WithError(err).Error("could not determine if the robot exists from error")
			return "", "", err
		}

		quayLogger.Debug("robot does not exist, creating quay robot account")
		robotCreatedResp, err := handler.Runtime.QuayClient.Robot.CreateOrgRobot(&robot.CreateOrgRobotParams{
			Orgname:        organizationName,
			RobotShortname: robotName,
		}, handler.Runtime.QuayAuth)
		if err != nil {
			badReqErr, ok := err.(*robot.CreateOrgRobotBadRequest)
			if !ok || !strings.Contains(badReqErr.Payload.ErrorMessage, "Existing robot") {
				return "", "", err
			}
			// The payload contains a message saying the robot exists, but our
			// original GetOrgRobot returned no robot, so we do not have the
			// token, but know it exists. Return instead of trying to query
			// again since the job should simply run again.
			return "", "", fmt.Errorf("unable to create robot, already exists but was unable to retrieve token")
		}
		token = robotCreatedResp.Payload.Token
		fullRobotName = robotCreatedResp.Payload.Name
	} else {
		quayLogger.Debug("found a quay robot account that already exists")
		token = robotGetResp.Payload.Token
		fullRobotName = robotGetResp.Payload.Name
	}
	return fullRobotName, token, nil
}

func (handler *QuayAccountJobHandler) monitorProducts(ctx context.Context) {
	prev := time.Second
	maxBackoff := time.Duration(10) * time.Second
	reconcileInterval := time.Duration(30) * time.Second

	for {
		err := handler.getPlanTeamMapping(ctx)
		if err != nil {
			handler.Runtime.Logger.WithError(err).Error("unable to list products")
			timeutil.ExpBackoff(prev, maxBackoff)
		}
		time.Sleep(reconcileInterval)
	}
}

func (handler *QuayAccountJobHandler) getPlanTeamMapping(ctx context.Context) error {
	newCtx, _ := context.WithTimeout(ctx, handler.Runtime.RPCTimeout)
	productsResp, err := handler.Runtime.AccountClient.ListProducts(newCtx, &pb.ListProductsReq{
		IncludeDeleted: true,
		IncludePrivate: true,
	})
	if err != nil {
		return err
	}
	ratePlanToTeam := make(map[string][]string)
	for _, product := range productsResp.GetItems() {
		for _, rp := range product.GetRatePlans() {
			if len(rp.QuayTeams) < 1 {
				continue
			}
			ratePlanToTeam[rp.ID] = rp.QuayTeams
		}
	}
	handler.mu.Lock()
	handler.ratePlanToTeam = ratePlanToTeam
	handler.mu.Unlock()
	return nil
}

func isRobotNotFoundErr(err error) bool {
	// TODO(chance): remove old style error when quay moves fully over to
	// proper error types

	// Old style error
	badReqErr, isBadReqErr := err.(*robot.GetOrgRobotBadRequest)
	// New style error
	_, isNotFoundErr := err.(*robot.GetOrgRobotNotFound)

	return isNotFoundErr || (isBadReqErr && strings.Contains(badReqErr.Payload.Message, "Could not find"))
}
