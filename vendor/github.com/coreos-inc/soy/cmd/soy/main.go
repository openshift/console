package main

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/Sirupsen/logrus"
	"github.com/johntdyer/slackrus"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var (
	mainConfig *viper.Viper
	rootCmd    = &cobra.Command{
		Use: "soy [app]",
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			mainConfig = newViper("soy")
			mainConfig.BindPFlags(cmd.Flags())

			initializeGlobalLogConfig()

			slackURL := mainConfig.GetString("slack-hook-url")
			if slackURL != "" {
				slackChannel := mainConfig.GetString("slack-channel")
				if slackChannel == "" {
					logrus.Fatal("You must provide the slack channel when slack notifications are configured.")
				}
				logHooks = append(logHooks, &slackrus.SlackrusHook{
					HookURL:        slackURL,
					AcceptedLevels: []logrus.Level{logrus.ErrorLevel},
					Channel:        slackChannel,
					Username:       "tectonic-com-bot",
				})
				logrus.Debugf("slack configured to send errors to %s in slack", slackChannel)
			} else {
				logrus.Debug("slack-hook-url empty, not sending errors to slack")
			}
		},
	}

	logLevel     logrus.Level
	rpcEndpoint  string
	logHooks     []logrus.Hook
	logFormatter logrus.Formatter
)

func init() {
	rootCmd.PersistentFlags().String("log-level", logrus.InfoLevel.String(), "Set the global log level")
	rootCmd.PersistentFlags().Bool("log-timestamp", false, "Log the full timestamp (only applies if ENVIRONMENT is not 'production')")
	rootCmd.PersistentFlags().String("slack-hook-url", "", "URL for slack hook - used to send critical alerts")
	rootCmd.PersistentFlags().String("slack-channel", "", "Channel for slack notifications")
}

func newViper(appName string) *viper.Viper {
	v := viper.New()
	// Set env prefix
	v.SetEnvPrefix(appName)
	// Setup viper to read from environment.
	v.AutomaticEnv()
	// Allow usage of "-" in flags but "_" in env vars.
	v.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))
	// Also read from a config file.
	v.SetConfigName("config")
	v.AddConfigPath(filepath.Join("config", appName))
	v.AddConfigPath(filepath.Join("/", "etc", appName))

	err := v.ReadInConfig()
	if err != nil {
		// Ignore errors from non-existant configuration file.
		if _, ok := err.(viper.UnsupportedConfigError); !ok {
			logrus.Warnf("Error reading config file: %v", err)
		}
	}
	return v
}

func initializeGlobalLogConfig() {
	environment := os.Getenv("ENVIRONMENT")
	if environment == "production" {
		logFormatter = &logrus.JSONFormatter{}
		os.Setenv("AWS_PROFILE", "prod")
	} else {
		logFormatter = &logrus.TextFormatter{
			FullTimestamp: mainConfig.GetBool("log-timestamp"),
		}
		os.Setenv("AWS_PROFILE", "dev")
	}
	logrus.SetFormatter(logFormatter)

	var err error
	strLogLevel := mainConfig.GetString("log-level")
	logLevel, err = logrus.ParseLevel(strLogLevel)
	if err != nil {
		logrus.Fatalf("Invalid log-level: %s", strLogLevel)
	}
	logrus.SetLevel(logLevel)
	logrus.Infof("setting log level to %s", logLevel)
}

// logConfig represents configuration for a new logger.
type logConfig struct {
	appName     string
	packageName string
	hooks       []logrus.Hook
	formatter   logrus.Formatter
}

// newLogger returns an initialized logger with the
// provided configuration.
func newLogger(cfg logConfig) *logrus.Entry {
	for i := range cfg.hooks {
		logrus.AddHook(cfg.hooks[i])
	}

	fields := make(logrus.Fields)
	if cfg.appName != "" {
		fields["app"] = cfg.appName
	}
	if cfg.packageName != "" {
		fields["package"] = cfg.packageName
	}

	return logrus.WithFields(fields)
}

// defaultLogConfig returns a default configuration
// struct that contains widely used and often unchanged
// configuration that is gathered at startup time.
func defaultLogConfigForApp(appName string) logConfig {
	return logConfig{
		appName: appName,
		hooks:   logHooks,
	}
}

func main() {
	rootCmd.Execute()
}
