package manager

import (
	"fmt"
	"io/ioutil"

	"github.com/Sirupsen/logrus"
	"github.com/authclub/billforward/client"
	"github.com/coreos/go-oidc/jose"
	"github.com/jonboulle/clockwork"

	"github.com/coreos-inc/soy/common"
	"github.com/coreos-inc/soy/common/billforward"
	"github.com/coreos-inc/soy/common/email"
	"github.com/coreos-inc/soy/common/pubsub"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/repo"
)

// Config represents the configuration for the manager.
type Config struct {
	PublisherType     PublisherType
	AggregatingPlanID string
	LicenseSigningKey string
	RootURL           string
	EmailConfig       email.EmailConfig
	EmailTemplates    *EmailTemplateConfig
}

// Manager handles all business logic. The service (RPC) layer takes incoming requests,
// potentially creates a database transaction, and then defers all heavy lifting to
// the manager.
// Manager contains the BillForward client to talk to their API, as well as resource
// specific types for handling specific business logic as it relates to users,
// accounts, etc...
type Manager struct {
	Clock         clockwork.Clock
	BFClient      *client.BillForward
	LicenseSigner jose.Signer
	Account       Account
	Product       Product
	Profile       Profile
	User          User
	Subscription  Subscription
	Invoice       Invoice
	logger        *logrus.Entry
}

// NewManager returns a new manager using the provided configuration.
func NewManager(logger *logrus.Entry, cfg Config, bfClient *client.BillForward, dbConn db.DB, emailer email.Emailer) *Manager {
	var publisher pubsub.Publisher
	switch cfg.PublisherType {
	case NoopPublisherType:
		publisher = pubsub.NoopPublisher{}
	case PostgresPublisherType:
		publisher = NewPostgresJobPublisher(dbConn, nil)
	default:
		panic(fmt.Sprintf("invalid publisher type: %s", cfg.PublisherType))
	}

	err := repo.PrepareStatements(dbConn)
	if err != nil {
		logger.WithError(err).Fatal("error db prepared statements failed to initialize")
	}

	clock := clockwork.NewRealClock()
	sub := subscription{bfClient: bfClient}

	signingKeyBytes, err := ioutil.ReadFile(cfg.LicenseSigningKey)
	if err != nil {
		logger.Fatalf("unable to read license signing key: %s", cfg.LicenseSigningKey)
	}
	privateKey, err := common.ParseRSAPrivateKeyFromPEM(signingKeyBytes)
	if err != nil {
		logger.Fatalf("unableto parse RSA private key from: %s, err: %s", cfg.LicenseSigningKey, err)
	}
	signer := jose.NewSignerRSA("tectonic-license-key", *privateKey)

	return &Manager{
		BFClient: bfClient,
		Clock:    clock,
		Account: account{
			bfClient:          bfClient,
			publisher:         publisher,
			clock:             clock,
			aggregatingPlanID: cfg.AggregatingPlanID,
			subscription:      sub,
			logger:            logger,
			licenseSigner:     signer,
		},
		User: user{
			publisher:      publisher,
			logger:         logger,
			emailer:        emailer,
			emailConfig:    cfg.EmailConfig,
			emailTemplates: cfg.EmailTemplates,
			sendEmails:     true,
			rootURL:        cfg.RootURL,
		},
		Subscription: sub,
		Invoice:      invoice{bfClient: bfClient},
		Product:      product{bfClient: bfClient},
		Profile:      profile{bfClient: bfClient},
		logger:       logger,
	}
}

// NewTestManager returns a manager suitable for use
// in the test environment.
func NewTestManager() *Manager {
	bfClient := billforward.NewClient(billforward.Config{
		BillforwardEndpoint: "localhost",
		BillforwardToken:    "notreal",
	})

	clock := clockwork.NewFakeClock()
	testLogger := logrus.WithField("component", "test-manager")

	return &Manager{
		BFClient: bfClient,
		Account: account{
			bfClient:  bfClient,
			publisher: pubsub.NoopPublisher{},
			clock:     clock,
			logger:    testLogger,
		},
		User:         newTestUser(),
		Subscription: subscription{bfClient: bfClient},
		Invoice:      invoice{bfClient: bfClient},
		Product:      product{bfClient: bfClient},
		Profile:      profile{bfClient: bfClient},
		logger:       testLogger,
	}
}

func newTestUser() user {
	return user{
		sendEmails: false,
	}
}
