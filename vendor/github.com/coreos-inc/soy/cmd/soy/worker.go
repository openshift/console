package main

import (
	"github.com/Sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/coreos-inc/soy/db"
	"github.com/coreos-inc/soy/job"
	"github.com/coreos-inc/soy/worker"
)

var (
	quayConfig  job.QuayConfig
	workerCfg   worker.Config
	awsCfg      worker.AWSConfig
	dryRun      bool
	maxAttempts int

	logger *logrus.Entry
	workr  *worker.Worker
	dbConn db.DB

	workerCmdConfig *viper.Viper
	invokedCmd      *cobra.Command
)

func init() {
	workerCmd := &cobra.Command{
		Use:   "worker [workerType]",
		Short: "Run a worker that pulls jobs from either Postgres or SQS. Valid options are sqs and postgres.",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			cmd.Parent().PersistentPreRun(cmd.Parent(), args)

			logger = newLogger(defaultLogConfigForApp("soy-worker"))

			workerFlagsToConfig(invokedCmd)
			if dbConfig.DSN == "" {
				logger.Fatal("Must set --pg-dsn flag")
			}

			var err error
			dbLogger := logger.WithField("package", "db")
			dbConn, err = db.NewConnection(dbLogger, dbConfig)
			if err != nil {
				logger.WithError(err).Fatal("unable setup DB connection")
			}
		},
	}
	workerCmd.PersistentFlags().Int64("max-backoff", 10, "The maximum duration (in seconds) to wait before retrying a job")
	workerCmd.PersistentFlags().Int64("max-wait", 10, "The maximum duration (in seconds) to wait for messages from the queue before returning")
	workerCmd.PersistentFlags().Int64("visibility-timeout", 30, "How long before a message gets put back into the queue if unacknowledged")
	workerCmd.PersistentFlags().String("rpc-endpoint", "127.0.0.1:8181", "IP/Port of the SOY API server")

	workerAWSCmd := &cobra.Command{
		Use:   "sqs [worker]",
		Short: "Pull jobs from AWS SQS",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			cmd.Parent().PersistentPreRun(cmd.Parent(), args)
			if awsCfg.AWSRegion == "" {
				logger.Fatal("Must set --aws-region flag")
			}

			var err error
			workr, err = worker.NewAWSWorker(logger, workerCfg, awsCfg)
			if err != nil {
				logger.WithError(err).Fatal("Unable to create AWS Worker")
			}
		},
	}
	workerAWSCmd.PersistentFlags().String("queue-url", "", "Manually set the queueURL to retrieve jobs from for this worker")
	workerAWSCmd.PersistentFlags().String("aws-region", "", "AWS region to use")

	workerPGCmd := &cobra.Command{
		Use:   "postgres [worker]",
		Short: "Pull jobs from Postgres directly",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			cmd.Parent().PersistentPreRun(cmd.Parent(), args)

			var err error
			workr, err = worker.NewPostgresWorker(logger, dbConn, workerCfg, dbConfig, int64(maxAttempts))
			if err != nil {
				logger.WithError(err).Fatal("Unable to create Postgres Worker")
			}
		},
	}
	workerPGCmd.PersistentFlags().String("pg-dsn", "", "Postgres connection string in DSN format")
	workerPGCmd.PersistentFlags().Int("max-idle-connections", 0, "Max idle connections in the idle connection pool")
	workerPGCmd.PersistentFlags().Int("max-open-connections", 0, "Max open connections to the database")
	workerPGCmd.PersistentFlags().Int("max-attempts", 10, "Max number of times a worker should attempt to do a job")
	workerPGCmd.PersistentFlags().Bool("sql-logging", false, "Enable logging of SQL statements")

	quayAccountWorkerCmd := &cobra.Command{
		Use:   "quay-account",
		Short: "Handles creating new quay robot accounts and adding/removing them to/from teams",
		Run:   runQuayAccountWorker,
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			invokedCmd = cmd
			cmd.Parent().PersistentPreRun(cmd.Parent(), args)
		},
	}
	quayAccountWorkerCmd.PersistentFlags().String("quay-api-key", "", "Quay.io API Key")
	quayAccountWorkerCmd.PersistentFlags().String("quay-organization", "", "Quay.io Organization")
	quayAccountWorkerCmd.PersistentFlags().String("quay-prefix", "tec_", "Prefix to put in front of the generated robot account name")
	quayAccountWorkerCmd.PersistentFlags().Bool("dry-run", false, "Do not make any changes to quay teams when running this worker (will still new create quay accounts if necessary)")

	licenseWorkerCmd := &cobra.Command{
		Use:   "license",
		Short: "Handles creating and syncing changes to licenses",
		Run:   runLicenseWorker,
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			invokedCmd = cmd
			cmd.Parent().PersistentPreRun(cmd.Parent(), args)
		},
	}

	workerCmd.AddCommand(workerAWSCmd)
	workerCmd.AddCommand(workerPGCmd)

	workerAWSCmd.AddCommand(quayAccountWorkerCmd)
	workerPGCmd.AddCommand(quayAccountWorkerCmd)

	workerAWSCmd.AddCommand(licenseWorkerCmd)
	workerPGCmd.AddCommand(licenseWorkerCmd)

	rootCmd.AddCommand(workerCmd)
}

func workerFlagsToConfig(cmd *cobra.Command) {
	workerCmdConfig = newViper("soy_worker")
	workerCmdConfig.BindPFlags(cmd.Flags())

	workerCfg.MaxBackoffSec = int64(workerCmdConfig.GetInt("max-backoff"))
	workerCfg.WaitTimeSec = int64(workerCmdConfig.GetInt("max-wait"))
	workerCfg.VisibilityTimeoutSec = int64(workerCmdConfig.GetInt("visibility-timeout"))

	awsCfg.QueueURL = workerCmdConfig.GetString("queue-url")
	awsCfg.AWSRegion = workerCmdConfig.GetString("aws-region")

	dbConfig.DSN = workerCmdConfig.GetString("pg-dsn")
	dbConfig.MaxIdleConnections = workerCmdConfig.GetInt("max-idle-connections")
	dbConfig.MaxOpenConnections = workerCmdConfig.GetInt("max-open-connections")
	dbConfig.EnableSQLLogging = workerCmdConfig.GetBool("sql-logging")

	rpcEndpoint = workerCmdConfig.GetString("rpc-endpoint")
	dryRun = workerCmdConfig.GetBool("dry-run")
	maxAttempts = workerCmdConfig.GetInt("max-attempts")

	quayConfig.APIKey = workerCmdConfig.GetString("quay-api-key")
	quayConfig.Organization = workerCmdConfig.GetString("quay-organization")
	quayConfig.Prefix = workerCmdConfig.GetString("quay-prefix")
}

func runQuayAccountWorker(cmd *cobra.Command, args []string) {
	if quayConfig.APIKey == "" {
		logger.Fatal("flag --quay-api-key is required")
	}
	if quayConfig.Organization == "" {
		logger.Fatal("flag --quay-organization is required")
	}

	channel, handler, err := worker.NewQuayAccountWorker(logger, dbConn, rpcEndpoint, quayConfig)
	if err != nil {
		logger.WithError(err).Fatal("Unable to create QuayAccountWorker")
	}
	handler.DryRun = dryRun

	err = workr.Start(workerCfg, channel, handler)
	if err != nil {
		logger.WithError(err).Fatal("Error running QuayAccountWorker")
	}
	logger.Info("QuayAccountWorker has stopped and will now exit")
}

func runLicenseWorker(cmd *cobra.Command, args []string) {
	channel, handler, err := worker.NewLicenseWorker(logger, dbConn, rpcEndpoint)
	if err != nil {
		logger.WithError(err).Fatal("Unable to create LicenseWorker")
	}

	err = workr.Start(workerCfg, channel, handler)
	if err != nil {
		logger.WithError(err).Fatal("Error running LicenseWorker")
	}
	logger.Info("LicenseWorker has stopped and will now exit")
}
