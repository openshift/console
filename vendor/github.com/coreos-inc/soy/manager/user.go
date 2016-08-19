package manager

import (
	"bytes"
	"fmt"

	"github.com/Sirupsen/logrus"

	"github.com/coreos-inc/soy/common/email"
	"github.com/coreos-inc/soy/common/pubsub"
	"github.com/coreos-inc/soy/common/serrors"
	"github.com/coreos-inc/soy/db"
	pb "github.com/coreos-inc/soy/proto"
	"github.com/coreos-inc/soy/repo"
)

// User represents a backend user.
type User interface {
	Get(db.Queryer, string) (*pb.User, error)
	Create(db.Queryer, string, string) error
	Invite(db.Queryer, string, string, string, string) error
	AcceptInvitation(db.Queryer, string, string, string) error
	AcceptAllInvitation(db.Queryer, string) error
	ListForAccount(db.Queryer, string) ([]*pb.UserListUser, error)
}

type user struct {
	publisher      pubsub.Publisher
	emailer        email.Emailer
	emailConfig    email.EmailConfig
	emailTemplates *EmailTemplateConfig
	rootURL        string
	sendEmails     bool
	logger         *logrus.Entry
}

// Get returns the user specified by dexID.
func (u user) Get(sdb db.Queryer, dexID string) (*pb.User, error) {
	usr, err := repo.GetUserByDexID(sdb, dexID)
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.NotFound:
			return nil, serrors.Errorf(serrors.NotFound, err, "User not found with ID: %s", dexID)
		}
		return nil, err
	}

	pbUser := &pb.User{
		DexID: usr.DexID,
		Email: usr.Email,
	}
	for _, a := range usr.Accounts {
		pbUser.AccountRoles = append(pbUser.AccountRoles, &pb.User_AccountRole{
			AccountID: a.BFAccountID,
			Role: &pb.RoleValue{
				Value: pb.Role(pb.Role_value[a.Role]),
			},
		})
	}

	return pbUser, nil
}

// Create creates a new backend user.
func (u user) Create(sdb db.Queryer, dexID, email string) error {
	err := repo.CreateUser(sdb, &repo.User{DexID: dexID, Email: email})
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.AlreadyExists:
			return serrors.Errorf(serrors.AlreadyExists, err, "Error creating user. User already exists with ID: %s", dexID)
		}
		return err
	}
	return nil
}

// Invite creates a new invited user.
func (u user) Invite(sdb db.Queryer, email, bfAccountID, inviterDexID, role string) error {
	if !ValidEmail(email) {
		err := fmt.Errorf("Invite User: invalid email address: %s for accountID: %s", email, bfAccountID)
		return serrors.Errorf(serrors.Validation, err, "Invalid email address.")
	}
	if bfAccountID == "" {
		err := fmt.Errorf("Invite User: missing required accountID")
		return serrors.Errorf(serrors.Validation, err, "Error inviting user.")
	}
	if !ValidRole(role) {
		err := fmt.Errorf("Invite User: invalid role")
		return serrors.Errorf(serrors.Validation, err, "Error inviting user.")
	}

	err := repo.CreateInvitedUser(sdb, email, bfAccountID, inviterDexID, role)
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.AlreadyExists:
			return serrors.Errorf(serrors.AlreadyExists, err, "Error inviting user. User %s already invited to account %s", email, bfAccountID)
		default:
			return serrors.Errorf(serrors.Internal, err, "Error inviting user %s to account %s", email, bfAccountID)
		}
	}

	inviter, err := repo.GetUserByDexID(sdb, inviterDexID)
	if err != nil {
		return serrors.Errorf(serrors.Internal, err, "Error inviting user. Error looking up inviter with userID %s", inviterDexID)
	}

	if u.sendEmails {
		go func() {
			emailMsg, err := u.newInviteEmail(email, role, inviterDexID, inviter.Email)
			if err != nil {
				u.logger.Errorf("unable to create invite email: %s", err)
				return
			}
			if err := u.emailer.SendEmail(emailMsg); err != nil {
				u.logger.Errorf("unable to send invite email: %s", err)
			}
		}()
	}
	return nil
}

func (u user) newInviteEmail(invitedEmail, invitedRole, inviterDexID, inviterEmail string) (*email.EmailMessage, error) {
	var textBuf, htmlBuf bytes.Buffer
	err := u.emailTemplates.TextTemplates.ExecuteTemplate(&textBuf, "invite.txt", map[string]interface{}{
		"inviterEmail": inviterEmail,
		"rootURL":      u.rootURL,
	})
	if err != nil {
		return nil, fmt.Errorf("unable to render text invite email: %s", err)
	}
	err = u.emailTemplates.HTMLTemplates.ExecuteTemplate(&htmlBuf, "invite.html", map[string]interface{}{
		"inviterEmail": inviterEmail,
		"rootURL":      u.rootURL,
	})
	if err != nil {
		return nil, fmt.Errorf("unable to render html invite email: %s", err)
	}

	return &email.EmailMessage{
		Subject: fmt.Sprintf("%s has invited you to join their Tectonic account", inviterEmail),
		From:    u.emailConfig.From,
		To:      []string{invitedEmail},
		BCC:     u.emailConfig.BCC,
		Headers: u.emailConfig.DefaultHeaders,
		Text:    textBuf.String(),
		HTML:    htmlBuf.String(),
	}, nil
}

// AcceptInvitation turns an invited user into an actual user, who is then
// associated with the account they were invited to with the role that was
// specified in the invitation.
func (u user) AcceptInvitation(sdb db.Queryer, email, bfAccountID, dexID string) error {
	err := repo.AcceptInvitation(sdb, email, bfAccountID)
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.NotFound:
			return serrors.Errorf(serrors.NotFound, err, "Could not accept invitation. No invitation found for user %s and account %s", email, bfAccountID)
		default:
			return serrors.Errorf(serrors.Internal, err, "Could not accept invitation for user %s and account %s", email, bfAccountID)
		}
	}
	inv, err := repo.GetInvitedUserByEmailAndAccount(sdb, email, bfAccountID)
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.NotFound:
			return serrors.Errorf(serrors.NotFound, err, "Could not accept invitation. Could not find invited user %s for account %s", email, bfAccountID)
		default:
			return serrors.Errorf(serrors.Internal, err, "Could not accept invitation for user %s and account %s", email, bfAccountID)
		}
	}
	return CreateUserAccount(sdb, bfAccountID, dexID, pb.Role(pb.Role_value[inv.Role]), false)
}

// AcceptAllInvitation accepts all outstanding invitations for a user by email.
// It assumes the user record already exists which is why a DexID is passed here.
func (u user) AcceptAllInvitation(sdb db.Queryer, dexID string) error {
	usr, err := repo.GetUserByDexID(sdb, dexID)
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.NotFound:
			return serrors.New(serrors.NotFound, err)
		}
		return err
	}

	err = repo.CreateUserAccountsForPendingInvitations(sdb, usr.Email, dexID)
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.NotFound:
			return serrors.Errorf(serrors.NotFound, err, "Could not accept invitations. No invitations found for user: %s", usr.Email)
		default:
			return serrors.Errorf(serrors.Internal, err, "Could not accept invitations for user: %s", usr.Email)
		}
	}

	err = repo.AcceptAllUserInvitations(sdb, usr.Email)
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.NotFound:
			return serrors.Errorf(serrors.NotFound, err, "Could not accept invitations. No invitations found for user: %s", usr.Email)
		default:
			return serrors.Errorf(serrors.Internal, err, "Could not accept invitations for user: %s", usr.Email)
		}
	}

	return nil
}

func CreateUserAccount(sdb db.Queryer, bfAccountID, dexID string, role pb.Role, ignoreExists bool) error {
	if ignoreExists {
		if err := repo.UpsertUserAccount(sdb, &repo.UserAccount{
			BFAccountID: bfAccountID,
			DexID:       dexID,
			Role:        role.String(),
		}); err != nil {
			return serrors.Errorf(serrors.Internal, err, "Error adding user to account.")
		}
		return nil
	}

	if err := repo.CreateUserAccount(sdb, &repo.UserAccount{
		BFAccountID: bfAccountID,
		DexID:       dexID,
		Role:        role.String(),
	}); err != nil {
		if serrors.TypeOf(err) == serrors.AlreadyExists {
			err = fmt.Errorf("Could not add user to account, user %s already associated with account %s", dexID, bfAccountID)
			return serrors.Errorf(serrors.AlreadyExists, err, "User already associated with this account.")
		}
		return serrors.Errorf(serrors.Internal, err, "Error adding user to account.")
	}
	return nil
}

func (u user) ListForAccount(sdb db.Queryer, accountID string) ([]*pb.UserListUser, error) {
	users, err := repo.ListForAccount(sdb, accountID)
	if err != nil {
		switch serrors.TypeOf(err) {
		case serrors.NotFound:
			return nil, serrors.Errorf(serrors.NotFound, err, "No users found for account")
		}
		return nil, err
	}

	pbUsers := []*pb.UserListUser{}
	for _, u := range users {
		r := pb.Role(pb.Role_value[u.Role])
		pbUsers = append(pbUsers, &pb.UserListUser{
			DexID: u.DexID,
			Email: u.Email,
			Role:  r,
		})
	}

	return pbUsers, nil
}
