package main

import (
	"log"
	"strings"

	"github.com/Sirupsen/logrus"
	"github.com/coreos-inc/soy/common/email"
	"github.com/mailgun/mailgun-go"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/coreos-inc/soy/common/billforward"
	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/manager"
	"github.com/coreos-inc/soy/server"
)

var (
	serverConfig  server.Config
	managerConfig manager.Config
	dbConfig      db.Config
	bfConfig      billforward.Config
	publisherType string

	emailerType       string
	emailer           email.Emailer
	emailTemplateDirs []string

	mailgunDomain        string
	mailgunPrivateAPIKey string
	mailgunPublicAPIKey  string
	mailgunTestMode      bool

	serverCmdConfig *viper.Viper
)

func init() {
	serverCmd := &cobra.Command{
		Use:   "server",
		Short: "Run the soy RPC server",
		PreRun: func(cmd *cobra.Command, args []string) {
			serverFlagsToConfig(cmd)
		},
		Run: runRPCServer,
	}

	serverCmd.Flags().String("rpc-listen", "0.0.0.0:8181", "RPC Host and Port to listen")
	serverCmd.Flags().String("http-listen", "0.0.0.0:8182", "HTTP Host and Port to listen on")

	serverCmd.Flags().String("aggregating-plan-id", "", "BillForward Aggregating Product Rate Plan ID used for all new Accounts.")
	serverCmd.Flags().String("license-signing-key", "", "Path to the license signing key")
	serverCmd.Flags().String("root-url", "https://account.tectonic.com", "The URL to use in emails referring to the account website.")

	serverCmd.Flags().String("publisher-type", "postgres", "The type of publisher to use. Valid options are noop and postgres.")

	serverCmd.Flags().String("emailer-type", "fake", "The type of emailer to use. Valid options are fake and mailgun.")
	serverCmd.Flags().String("emailer-from", "support@tectonic.com", "The email address to send emails from")
	serverCmd.Flags().String("emailer-bcc", "", "")
	serverCmd.Flags().String("email-templates", "templates/soy/email,templates/common/email/generated", "A comma separated list of directories to collect template files ending in .txt or .html from")

	serverCmd.Flags().String("mailgun-domain", "", "Mailgun domain")
	serverCmd.Flags().String("mailgun-private-apikey", "", "Mailgun Private API key")
	serverCmd.Flags().String("mailgun-public-apikey", "", "Mailgun Public API key")
	serverCmd.Flags().Bool("mailgun-enable-test", false, "Set Mailgun to test mode")

	serverCmd.Flags().String("billforward-token", "", "Access token for use with Bill Forward API")
	serverCmd.Flags().String("billforward-endpoint", "api-sandbox.billforward.net", "Endpoint to use for Bill Forward API")

	serverCmd.Flags().String("pg-dsn", "", "Postgres connection string in DSN format")
	serverCmd.Flags().Int("max-idle-connections", 0, "Max idle connections in the idle connection pool")
	serverCmd.Flags().Int("max-open-connections", 0, "Max open connections to the database")
	serverCmd.Flags().Bool("sql-logging", false, "Enable logging of SQL statements")

	rootCmd.AddCommand(serverCmd)
}

func serverFlagsToConfig(cmd *cobra.Command) {
	serverCmdConfig = newViper("soy_server")
	serverCmdConfig.BindPFlags(cmd.Flags())
	publisherType = serverCmdConfig.GetString("publisher-type")

	emailerType = serverCmdConfig.GetString("emailer-type")
	var bcc []string
	if bccList := serverCmdConfig.GetString("emailer-bcc"); bccList != "" {
		bcc = strings.Split(bccList, ",")
	}
	managerConfig.EmailConfig = email.EmailConfig{
		From: serverCmdConfig.GetString("emailer-from"),
		BCC:  bcc,
	}
	emailTemplateDirs = strings.Split(serverCmdConfig.GetString("email-templates"), ",")

	mailgunDomain = serverCmdConfig.GetString("mailgun-domain")
	mailgunPrivateAPIKey = serverCmdConfig.GetString("mailgun-private-apikey")
	mailgunPublicAPIKey = serverCmdConfig.GetString("mailgun-public-apikey")
	mailgunTestMode = serverCmdConfig.GetBool("mailgun-enable-test")

	// Configure server
	serverConfig.RPCListen = serverCmdConfig.GetString("rpc-listen")
	serverConfig.HTTPListen = serverCmdConfig.GetString("http-listen")

	// Configure manager
	managerConfig.AggregatingPlanID = serverCmdConfig.GetString("aggregating-plan-id")
	managerConfig.LicenseSigningKey = serverCmdConfig.GetString("license-signing-key")
	managerConfig.RootURL = serverCmdConfig.GetString("root-url")

	// Configure Bill Forward client
	bfConfig.BillforwardToken = serverCmdConfig.GetString("billforward-token")
	bfConfig.BillforwardEndpoint = serverCmdConfig.GetString("billforward-endpoint")

	// Configure DB
	dbConfig.DSN = serverCmdConfig.GetString("pg-dsn")
	dbConfig.MaxIdleConnections = serverCmdConfig.GetInt("max-idle-connections")
	dbConfig.MaxOpenConnections = serverCmdConfig.GetInt("max-open-connections")
	dbConfig.EnableSQLLogging = serverCmdConfig.GetBool("sql-logging")
}

func runRPCServer(cmd *cobra.Command, args []string) {
	logger := newLogger(defaultLogConfigForApp("soy-server"))

	if dbConfig.DSN == "" {
		logger.Fatal("Must set --pg-dsn flag")
	}

	if bfConfig.BillforwardEndpoint == "" {
		logger.Fatal("Must set --billforward-endpoint")
	}
	if bfConfig.BillforwardToken == "" {
		logger.Fatal("Must set --billforward-token")
	}

	if managerConfig.AggregatingPlanID == "" {
		logger.Fatal("Must set --aggregating-plan-id")
	}
	if managerConfig.LicenseSigningKey == "" {
		logger.Fatal("Must set --license-signing-key")
	}

	if publisherType == "" {
		logger.Fatal("Must set --publisher-type")
	} else {
		managerConfig.PublisherType = manager.PublisherType(publisherType)
	}

	if serverConfig.RPCListen == "" {
		logger.Fatalf("invalid RPC host/port: %q", serverConfig.RPCListen)
	}
	if serverConfig.HTTPListen == "" {
		logger.Fatalf("invalid HTTP host/port: %q", serverConfig.HTTPListen)
	}

	switch emailerType {
	case "fake":
		emailer = email.FakeEmailer{}
	case "mailgun":
		if mailgunDomain == "" {
			logrus.Fatalf("mailgun domain must be set")
		}
		if mailgunPrivateAPIKey == "" {
			logrus.Fatalf("mailgun private api key must be set")
		}
		if mailgunPublicAPIKey == "" {
			logrus.Fatalf("mailgun public api key must be set")
		}

		if mailgunTestMode {
			logrus.Info("mailgun test mode enabled")
		}

		mglogger := logger.WithField("component", "mailgun")
		emailer = &email.MailgunEmailer{
			Client:   mailgun.NewMailgun(mailgunDomain, mailgunPrivateAPIKey, mailgunPublicAPIKey),
			TestMode: mailgunTestMode,
			Logger:   mglogger,
		}
	default:
		log.Fatalf("invalid emailer type %s, must be one of fake or mailgun", emailerType)
	}

	var err error
	managerConfig.EmailTemplates, err = manager.NewEmailTemplateConfigFromDirs(emailTemplateDirs)
	if err != nil {
		logger.WithError(err).Fatal("unable to get email templates")
	}

	dbLogger := logger.WithField("package", "db")
	dbConn, err := db.NewConnection(dbLogger, dbConfig)
	if err != nil {
		logger.WithError(err).Fatal("unable to establish db connection")
	}

	mgrLogger := logger.WithField("package", "manager")
	bfClient := billforward.NewClient(bfConfig)
	mgr := manager.NewManager(mgrLogger, managerConfig, bfClient, dbConn, emailer)

	srv, err := server.New(logger, serverConfig, mgr, dbConn)
	if err != nil {
		logger.Fatalf("Unable to create RPC server: %v", err)
	}

	stop, err := srv.Run()
	if err != nil {
		logger.Fatalf("Unable to start RPC server: %v", err)
	}
	<-stop
}
