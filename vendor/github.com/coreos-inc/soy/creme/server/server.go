package server

import (
	"encoding/json"
	"errors"
	"fmt"
	htmltemplate "html/template"
	"mime"
	"net/http"
	"net/url"
	"path"
	"time"

	"github.com/Sirupsen/logrus"
	"github.com/coreos/pkg/health"
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	httprouter "gopkg.in/julienschmidt/httprouter.v1"

	"github.com/coreos-inc/soy/common/rpc"
	"github.com/coreos-inc/soy/creme/middleware"
	pb "github.com/coreos-inc/soy/proto"
	"github.com/coreos-inc/soy/server"
)

var plog = logrus.WithFields(logrus.Fields{"app": "creme", "package": "server"})

const (
	IndexPageTemplateName = "index.html"
	APIVersion            = "v1"
	httpPathAPI           = "/api"
	healthEndpoint        = "/health"
	staticEndpoint        = "/static/*filepath"
	AuthLoginEndpoint     = "/auth/login"
	AuthLogoutEndpoint    = "/auth/logout"
	AuthCallbackEndpoint  = "/auth/callback"
	versionEndpoint       = "/version"
	keysEndpoint          = "/keys"

	ctxKeyLoginState = "login-state"
)

var (
	rpcTimeout = 30 * time.Second

	apiResendVerificationEndpoint   = apiBasePath("/users/resend-verification")
	apiSignupEndpoint               = apiBasePath("/signup")
	apiAccountsEndpoint             = apiBasePath("/accounts")
	apiAccountEndpoint              = apiBasePath("/accounts/:account-id")
	apiAddressEndpoint              = apiBasePath("/accounts/:account-id/addresses")
	apiInvoicesEndpoint             = apiBasePath("/accounts/:account-id/invoices")
	apiInvoiceEndpoint              = apiBasePath("/accounts/:account-id/invoices/:invoice-id")
	apiSubscriptionsEndpoint        = apiBasePath("/accounts/:account-id/subscriptions")
	apiCancelSubscriptionEndpoint   = apiBasePath("/accounts/:account-id/subscriptions/:subscription-id/cancel")
	apiUncancelSubscriptionEndpoint = apiBasePath("/accounts/:account-id/subscriptions/:subscription-id/uncancel")
	apiCreditCardEndpoint           = apiBasePath("/accounts/:account-id/card")
	apiBillingStatusEndpoint        = apiBasePath("/accounts/:account-id/billing-status")
	apiAccountUsersEndpoint         = apiBasePath("/accounts/:account-id/users")
	apiAccountUserEndpoint          = apiBasePath("/accounts/:account-id/users/:user-id")
	apiAccountInvitedUserEndpoint   = apiBasePath("/accounts/:account-id/invited-users/:email")
	apiAccountUserRoleEndpoint      = apiBasePath("/accounts/:account-id/users/:user-id/role")
	apiUserEndpoint                 = apiBasePath("/users/:user-id")
	apiLicenseEndpoint              = apiBasePath("/accounts/:account-id/license")
	apiProductsEndpoint             = apiBasePath("/products")
)

func init() {
	mime.AddExtensionType(".svg", "image/svg+xml")
}

type jsGlobals struct {
	LoginURL             string `json:"loginURL"`
	LogoutURL            string `json:"logoutURL"`
	StripePublishableKey string `json:"stripeKey"`
	SentryURL            string `json:"sentryURL"`
}

type Config struct {
	HealthEndpoint       *url.URL
	PublicDir            string
	StripePublishableKey string
	SentryURL            string
	Templates            *htmltemplate.Template
	Auth                 *Authenticator
	AuthConfig           AuthConfig
	RPCConnection        *grpc.ClientConn
	Host                 string
	LicenseKeys          []Key
}

type Server struct {
	cfg       Config
	auth      *Authenticator
	mw        *middleware.Manager
	svcClient pb.AccountServiceClient
	rpcConn   *grpc.ClientConn
}

func NewServer(cfg Config) (*Server, error) {
	s := &Server{
		cfg:       cfg,
		mw:        middleware.NewManager(writeError),
		rpcConn:   cfg.RPCConnection,
		svcClient: pb.NewAccountServiceClient(cfg.RPCConnection),
	}

	auther, err := NewAuthenticator(cfg.AuthConfig, s.onLogin)
	if err != nil {
		plog.WithError(err).Error("Unable to configure authentication")
		return nil, err
	}
	s.auth = auther

	return s, nil
}

func (s *Server) rpcCtx(ls loginState) context.Context {
	ctx, _ := context.WithTimeout(context.Background(), rpcTimeout)
	md := metadata.Pairs(server.AuthDexKey, ls.UserID)
	ctx = metadata.NewContext(ctx, md)
	return ctx
}

func (s *Server) rpcCtxFromReq(r *http.Request) context.Context {
	ls := s.loginState(r)
	return s.rpcCtx(ls)
}

func (s *Server) HTTPHandler() http.Handler {
	// Main router.
	r := httprouter.New()
	r.Handler("GET", healthEndpoint, health.Checker{
		Checks: []health.Checkable{
			rpc.NewRPCHealthChecker(s.cfg.HealthEndpoint),
			rpc.NewRPCConnCheck(s.rpcConn),
			s.auth,
		},
	})

	r.HandlerFunc("GET", versionEndpoint, versionFunc)
	r.HandlerFunc("GET", keysEndpoint, keysFunc(s.cfg.LicenseKeys))

	// Auth Endpoints
	r.HandlerFunc("GET", AuthLoginEndpoint, s.auth.LoginFunc)
	r.HandlerFunc("GET", AuthCallbackEndpoint, s.auth.CallbackFunc)
	r.HandlerFunc("POST", AuthCallbackEndpoint, s.auth.CallbackFunc)
	r.HandlerFunc("POST", AuthLogoutEndpoint, s.auth.LogoutFunc)

	r.ServeFiles(staticEndpoint, http.Dir(s.cfg.PublicDir))
	r.NotFound = s.indexHandler
	r.HandlerFunc("GET", "/", s.indexHandler)

	loggerMW := LoggerMiddleware()
	authMW := AuthMiddleware(s.mw, s.auth)
	authNoEmailMW := AuthUnverifiedEmailMiddleware(s.mw, s.auth)
	healthMW := HealthCheckSuccessMiddleware(s.mw, []health.Checkable{rpc.NewRPCConnCheck(s.rpcConn)})

	// API router.
	apiR := httprouter.New()
	apiR.POST(apiResendVerificationEndpoint, s.mw.Chain(loggerMW, authNoEmailMW, s.resendVerification))
	apiR.PUT(apiAccountEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.updateAccount))
	apiR.DELETE(apiAccountEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.terminateAccount))
	apiR.GET(apiAccountsEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.listAccounts))
	apiR.POST(apiSignupEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.signup))
	apiR.GET(apiProductsEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.listProducts))
	apiR.POST(apiAddressEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.upsertAddress))
	apiR.GET(apiInvoicesEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.listInvoices))
	apiR.GET(apiInvoiceEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.getInvoice))
	apiR.GET(apiSubscriptionsEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.listSubscriptions))
	apiR.POST(apiCancelSubscriptionEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.cancelSubscription))
	apiR.POST(apiUncancelSubscriptionEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.uncancelSubscription))
	apiR.POST(apiCreditCardEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.createCreditCard))
	apiR.GET(apiCreditCardEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.getCreditCard))
	apiR.GET(apiBillingStatusEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.getBillingStatus))
	apiR.GET(apiAccountUsersEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.listUsers))
	apiR.POST(apiAccountUsersEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.inviteUser))
	apiR.DELETE(apiAccountUserEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.revokeUser))
	apiR.DELETE(apiAccountInvitedUserEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.revokeInvitedUser))
	apiR.GET(apiUserEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.getUser))
	apiR.POST(apiAccountUserRoleEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.changeUserRole))
	apiR.GET(apiLicenseEndpoint, s.mw.Chain(loggerMW, authMW, healthMW, s.getLicense))
	apiR.NotFound = apiNotFoundHandler

	// NOTE(sym3tri): Provides necessary sub-routing so index page isn't served for api 404s.
	mux := http.NewServeMux()
	mux.Handle("/api/", apiR)
	mux.Handle("/", r)
	return http.Handler(mux)
}

func (s *Server) loginState(r *http.Request) loginState {
	val := s.mw.GetValue(r, ctxKeyLoginState)
	return val.(loginState)
}

func (s *Server) upsertUser(ctx context.Context, dexID, email string) (*pb.User, error) {
	getResp, err := s.svcClient.GetUser(ctx, &pb.GetUserReq{
		DexID: dexID,
	})
	if err == nil {
		plog.Debugf("upsertUser: user already exists")
		return getResp.GetUser(), nil
	}

	if grpc.Code(err) != codes.NotFound {
		plog.WithError(err).Debug("upsertUser: unexpected grpc error during get")
		return nil, err
	}

	createResp, err := s.svcClient.CreateUser(ctx, &pb.CreateUserReq{
		DexID: dexID,
		Email: email,
	})
	if err != nil {
		plog.WithError(err).Debug("upsertUser: unexpected grpc error during create")
		return nil, err
	}

	return createResp.GetUser(), nil
}

// onLogin executes everytime a user successfully logs in.
func (s *Server) onLogin(ls loginState) string {
	if !ls.EmailVerified {
		plog.Debugf("login handler: email not yet verified, no action taken")
		return ""
	}

	ctx := s.rpcCtx(ls)

	_, err := s.upsertUser(ctx, ls.UserID, ls.Email)
	if err != nil {
		plog.WithError(err).Warning("login handler: error with user lookup/upsert")
		// TODO: message for user
		return "/error"
	}

	_, err = s.svcClient.ConvertExternallyCreatedAccounts(ctx, &pb.ConvertExternallyCreatedAccountsReq{
		DexID: ls.UserID,
		Email: ls.Email,
	})
	if err != nil {
		plog.WithError(err).Warning("login handler: error with external account conversion")
		// TODO: message for user
		return "/error"
	}

	_, err = s.svcClient.AcceptAllUserInvitations(ctx, &pb.AcceptAllUserInvitationsReq{
		DexID: ls.UserID,
	})
	if err != nil {
		if grpc.Code(err) == codes.NotFound {
			plog.Debugf("login handlerr: no invitations accepted for user ID: %s", ls.UserID)
		} else {
			plog.WithError(err).Warning("login handler: error accepting all oustanding invitations")
			// TODO: message for user
			return "/error"
		}
	}

	return ""
}

func (s *Server) resendVerification(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tok, err := s.auth.TokenExtractor(r)
	if err != nil {
		writeError(w, PublicError{
			HTTPStatus: http.StatusBadRequest,
			Inner:      fmt.Errorf("error extracting token from request: %v", err),
			Desc:       "You must log in to do this.",
		})
		return
	}

	if err = s.auth.ResendVerification(tok); err != nil {
		writeError(w, PublicError{
			Inner: err,
			Desc:  "Error resending email verification.",
		})
		plog.WithError(err).Error("resendVerification: error resending email verification")
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (s *Server) updateAccount(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	acctID := ps.ByName("account-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"accountID": acctID,
		"dexID":     ls.UserID,
	})

	var acct pb.Account
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&acct)
	if err != nil {
		writeError(w, PublicError{
			HTTPStatus: http.StatusBadRequest,
			Inner:      err,
			Desc:       "Something went wrong with your account update. Please check your data and try again.",
		})
		logger.WithError(err).Error("updateAccount: unable to decode account body")
		return
	}

	ctx := s.rpcCtxFromReq(r)

	getResp, err := s.svcClient.GetAccount(ctx, &pb.GetAccountReq{
		AccountID: acctID,
	})
	oldAcct := getResp.GetAccount()
	if oldAcct == nil {
		writeError(w, PublicError{
			HTTPStatus: http.StatusBadRequest,
			Inner:      err,
			Desc:       "Account does not exist.",
		})
		logger.WithError(err).Error("updateAccount: account does not exist")
	}

	// Do not allow user to update account email address.
	acct.Profile.Email = oldAcct.Profile.Email
	resp, err := s.svcClient.UpdateProfile(ctx, &pb.UpdateProfileReq{
		Profile: acct.Profile,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("updateAccount: unable to update account")
		return
	}

	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) terminateAccount(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	acctID := ps.ByName("account-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"accountID": acctID,
		"dexID":     ls.UserID,
	})

	resp, err := s.svcClient.TerminateAccount(s.rpcCtxFromReq(r), &pb.TerminateAccountReq{
		AccountID: acctID,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("terminateAccount: unable to terminate account")
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) listAccounts(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID": ls.UserID,
	})

	aResp, err := s.svcClient.ListAccounts(s.rpcCtxFromReq(r), &pb.ListAccountsReq{})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("listAccounts: unable to list accounts")
		return
	}

	writeResponseWithBody(w, http.StatusOK, aResp)
}

func (s *Server) listUsers(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	acctID := ps.ByName("account-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":     ls.UserID,
		"accountID": acctID,
	})

	aResp, err := s.svcClient.ListAccountUsers(s.rpcCtxFromReq(r), &pb.ListAccountUsersReq{
		AccountID: acctID,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("listUsers: unable to list users")
		return
	}

	writeResponseWithBody(w, http.StatusOK, aResp)
}

func (s *Server) inviteUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	acctID := ps.ByName("account-id")
	var reqBody struct {
		Email string `json:"email"`
		Role  int32  `json:"role"`
	}

	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":     ls.UserID,
		"accountID": acctID,
	})

	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&reqBody)
	if err != nil {
		writeError(w, PublicError{
			HTTPStatus: http.StatusBadRequest,
			Inner:      err,
			Desc:       "Something went wrong with your user invitation.",
		})
		logger.WithError(err).Error("inviteUser: unable to decode invite body")
		return
	}
	logger = logger.WithField("invitedEmail", reqBody.Email)

	resp, err := s.svcClient.InviteUser(s.rpcCtxFromReq(r), &pb.InviteUserReq{
		AccountID: acctID,
		Email:     reqBody.Email,
		Role:      parseRoleInput(reqBody.Role),
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("inviteUser: unable to invite user")
		return
	}

	// TODO: send email to invited user.

	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) revokeUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	acctID := ps.ByName("account-id")
	usrID := ps.ByName("user-id")

	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":        ls.UserID,
		"accountID":    acctID,
		"revokeUserID": usrID,
	})

	resp, err := s.svcClient.RevokeUserAccountAccess(s.rpcCtxFromReq(r), &pb.RevokeUserAccountAccessReq{
		AccountID:           acctID,
		ExistingMemberDexID: usrID,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("revokeUser: unable to revokeUser")
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) revokeInvitedUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	acctID := ps.ByName("account-id")
	email := ps.ByName("email")

	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":            ls.UserID,
		"accountID":        acctID,
		"invitedUserEmail": email,
	})

	resp, err := s.svcClient.RevokeUserAccountAccess(s.rpcCtxFromReq(r), &pb.RevokeUserAccountAccessReq{
		AccountID:        acctID,
		InvitedUserEmail: email,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("revokeInvitedUser: unable to revoke user account access")
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) getUser(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	usrID := ps.ByName("user-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":  ls.UserID,
		"userID": usrID,
	})

	resp, err := s.svcClient.GetUser(s.rpcCtxFromReq(r), &pb.GetUserReq{
		DexID: usrID,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("getUser: unable to get user")
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) changeUserRole(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	acctID := ps.ByName("account-id")
	usrID := ps.ByName("user-id")
	var reqBody struct {
		Role int32 `json:"role"`
	}

	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":     ls.UserID,
		"accountID": acctID,
	})

	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&reqBody)
	if err != nil {
		writeError(w, PublicError{
			HTTPStatus: http.StatusBadRequest,
			Inner:      err,
			Desc:       "Something went wrong with user role change.",
		})
		logger.WithError(err).Error("changeUserRole: unable to decode request body")
		return
	}

	newRole := parseRoleInput(reqBody.Role)
	logger = logger.WithField("newRole", newRole)

	resp, err := s.svcClient.ChangeUserRole(s.rpcCtxFromReq(r), &pb.ChangeUserRoleReq{
		AccountID: acctID,
		DexID:     usrID,
		Role:      newRole,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("changeUserRole: unable to change user role")
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func parseRoleInput(role int32) pb.Role {
	// Default to READONLY. Only other option for user input is ADMIN.
	_, ok := pb.Role_name[role]
	if ok && pb.Role(role) == pb.Role_ADMIN {
		return pb.Role_ADMIN
	}
	return pb.Role_READ_ONLY
}

func (s *Server) listProducts(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID": ls.UserID,
	})

	resp, err := s.svcClient.ListProducts(s.rpcCtxFromReq(r), &pb.ListProductsReq{
		IncludeDeleted: false,
		IncludePrivate: false,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("listProducts: unable to list products")
		return
	}

	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) upsertAddress(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID": ls.UserID,
	})

	var addr pb.Address
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&addr)
	if err != nil {
		writeError(w, PublicError{
			HTTPStatus: http.StatusBadRequest,
			Inner:      err,
			Desc:       "Something went wrong with your address update. Please check your data and try again.",
		})
		logger.WithError(err).Error("unable to decode request body")
		return
	}
	logger = logger.WithField("profileID", addr.ProfileID)

	resp, err := s.svcClient.UpsertAddress(s.rpcCtxFromReq(r), &pb.UpsertAddressReq{
		Address: &addr,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("upsertAddress: unable to upsert address")
		return
	}

	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) listInvoices(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	acctID := ps.ByName("account-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":     ls.UserID,
		"accountID": acctID,
	})

	resp, err := s.svcClient.ListInvoices(s.rpcCtxFromReq(r), &pb.ListInvoicesReq{
		AccountID: acctID,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("listInvoices: unable to list invoices")
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) getInvoice(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// TODO(sym3tri): support json versions too based on request headers
	invID := ps.ByName("invoice-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":     ls.UserID,
		"invoiceID": invID,
	})

	resp, err := s.svcClient.GetInvoiceAsPDF(s.rpcCtxFromReq(r), &pb.GetInvoiceAsPDFReq{
		InvoiceID: invID,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("getInvoice: unable to get invoice")
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/pdf")
	w.Write(resp.InvoiceData)
}

func (s *Server) listSubscriptions(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	acctID := ps.ByName("account-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":     ls.UserID,
		"accountID": acctID,
	})

	resp, err := s.svcClient.ListSubscriptions(s.rpcCtxFromReq(r), &pb.ListSubscriptionsReq{
		AccountID:      acctID,
		IncludeRetired: false,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("listSubscriptions: unable to list subscriptions")
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) cancelSubscription(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	ls := s.loginState(r)
	acctID := ps.ByName("account-id")
	subID := ps.ByName("subscription-id")

	logger := plog.WithFields(logrus.Fields{
		"dexID":          ls.UserID,
		"accountID":      acctID,
		"subscriptionID": subID,
	})

	resp, err := s.svcClient.CancelSubscription(s.rpcCtxFromReq(r), &pb.CancelSubscriptionReq{
		AccountID:      acctID,
		SubscriptionID: subID,
		Reason:         fmt.Sprintf("website self-service cancellation by: %s", ls.Email),
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("cancelSubscription: unable to cancel subscription")
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) uncancelSubscription(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	ls := s.loginState(r)
	acctID := ps.ByName("account-id")
	subID := ps.ByName("subscription-id")

	logger := plog.WithFields(logrus.Fields{
		"dexID":          ls.UserID,
		"accountID":      acctID,
		"subscriptionID": subID,
	})

	resp, err := s.svcClient.UncancelSubscription(s.rpcCtxFromReq(r), &pb.UncancelSubscriptionReq{
		AccountID:      acctID,
		SubscriptionID: subID,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("uncancelSubscription: unable to uncancel subscription")
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) createCreditCard(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID": ls.UserID,
	})

	var cardReq pb.CreateCreditCardReq
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&cardReq)
	if err != nil {
		writeError(w, PublicError{
			HTTPStatus: http.StatusBadRequest,
			Inner:      err,
			Desc:       "Something went wrong with your card creation. Please check your data and try again.",
		})
		logger.WithError(err).Error("createCreditCard: unable to decode request body")
		return
	}

	resp, err := s.svcClient.CreateCreditCard(s.rpcCtxFromReq(r), &cardReq)
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("createCreditCard: unable to create credit card")
		return
	}

	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) getCreditCard(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	accountID := ps.ByName("account-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":     ls.UserID,
		"accountID": accountID,
	})

	resp, err := s.svcClient.GetCreditCard(s.rpcCtxFromReq(r), &pb.GetCreditCardReq{
		AccountID: accountID,
	})
	if err != nil {
		// Not all accounts have credit cards, so this could be normal
		if grpc.Code(err) != codes.NotFound {
			logger.WithError(err).Error("getCreditCard: unable to get credit card")
		}
		writeError(w, err)
		return
	}

	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) getBillingStatus(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	accountID := ps.ByName("account-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":     ls.UserID,
		"accountID": accountID,
	})

	resp, err := s.svcClient.GetAccountStatus(s.rpcCtxFromReq(r), &pb.GetAccountStatusReq{
		AccountID: accountID,
	})
	if err != nil {
		writeError(w, err)
		logger.WithError(err).Error("getBillingStatus: unable to get billing status")
		return
	}

	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) getLicense(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	accountID := ps.ByName("account-id")
	ls := s.loginState(r)
	logger := plog.WithFields(logrus.Fields{
		"dexID":     ls.UserID,
		"accountID": accountID,
	})

	resp, err := s.svcClient.GetAssets(s.rpcCtxFromReq(r), &pb.GetAssetsReq{
		AccountID: accountID,
	})
	if err != nil {
		if grpc.Code(err) != codes.NotFound {
			logger.WithError(err).Error("getLicense: unable to get license")
		}
		writeError(w, err)
		return
	}
	writeResponseWithBody(w, http.StatusOK, resp)
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	jsg := &jsGlobals{
		LoginURL:             AuthLoginEndpoint,
		LogoutURL:            AuthLogoutEndpoint,
		StripePublishableKey: s.cfg.StripePublishableKey,
		SentryURL:            s.cfg.SentryURL,
	}
	if err := s.cfg.Templates.ExecuteTemplate(w, IndexPageTemplateName, jsg); err != nil {
		plog.WithError(err).Error("error executing index template")
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func apiNotFoundHandler(w http.ResponseWriter, r *http.Request) {
	writeError(w, PublicError{
		HTTPStatus: http.StatusNotFound,
		Inner:      errors.New("api route not found"),
		Desc:       "Not found.",
	})
}

func apiBasePath(s string) string {
	return path.Join(httpPathAPI, APIVersion, s)
}

// writeResponseWithBody attempts to marshal an arbitrary thing to JSON then write
// it to the http.ResponseWriter
func writeResponseWithBody(w http.ResponseWriter, code int, resp interface{}) {
	enc, err := json.Marshal(resp)
	if err != nil {
		plog.WithError(err).Error("Failed JSON-encoding HTTP response")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	if _, err = w.Write(enc); err != nil {
		plog.WithError(err).Error("Failed writing HTTP response")
	}
}
