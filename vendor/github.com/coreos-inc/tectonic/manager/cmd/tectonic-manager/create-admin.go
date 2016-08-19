package main

import (
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/spf13/cobra"
)

const defaultHealthCheckTimeout = time.Second * time.Duration(5)

// createAdminCmd represents the create-admin command
var (
	createAdminCmd = &cobra.Command{
		Use:   "create-admin",
		Short: "create the admin user for tectonic-identity",
		RunE: func(cmd *cobra.Command, args []string) error {
			return runCreateAdmin()
		},
		SilenceUsage: true,
	}

	createAdminOpts struct {
		APIKey           string
		UserEmail        string
		UserPassword     string
		OverlordURL      string
		GeneratePassword bool
		AdminUserSecret  string
	}
)

func init() {
	RootCmd.AddCommand(createAdminCmd)

	createAdminCmd.Flags().StringVar(&createAdminOpts.APIKey, "api-key", "", "")
	createAdminCmd.Flags().StringVar(&createAdminOpts.UserEmail, "user-email", "", "")
	createAdminCmd.Flags().StringVar(&createAdminOpts.UserPassword, "user-password", "", "")
	createAdminCmd.Flags().StringVar(&createAdminOpts.OverlordURL, "overlord-url", "", "")
	createAdminCmd.Flags().BoolVar(&createAdminOpts.GeneratePassword, "generate-password", false, "")
	createAdminCmd.Flags().StringVar(&createAdminOpts.AdminUserSecret, "admin-user-secret", "admin-user-info", "")
}

func runCreateAdmin() error {
	if createAdminOpts.OverlordURL == "" {
		return errors.New("overlord-url cannot be empty")
	}
	if createAdminOpts.UserEmail == "" {
		return errors.New("user-email cannot be empty")
	}
	if createAdminOpts.UserPassword == "" {
		return errors.New("user-password cannot be empty")
	}
	if createAdminOpts.APIKey == "" {
		return errors.New("api-key cannot be empty")
	}
	if createAdminOpts.AdminUserSecret == "" {
		return errors.New("admin-id-secret cannot be empty")
	}

	overlordURL, overlordHealthURL, err := getOverlordURLs()
	if err != nil {
		return err
	}

	secretName := createAdminOpts.AdminUserSecret
	logger.Printf("checking if secret %s containing adminID exists", secretName)
	exists, err := checkSecretExists(secretName)
	if err != nil {
		return fmt.Errorf("unable to check if secret %s exists: %v", secretName, err)
	}
	if exists {
		// Here we make the assumption that if this secret exists, the admin
		// user exists. We should be verifying this by querying Dex for the
		// user by ID.
		logger.Printf("secret %s already exists, not creating\n", secretName)
		return nil
	}
	logger.Printf("secret %s does not exist, attempting to create admin user", secretName)

	healthy := waitUntilHealthy(overlordHealthURL, 10)
	if !healthy {
		return fmt.Errorf("%s service did not become healthy after 10 attempts", overlordHealthURL)
	}

	logger.Printf("attempting to create admin user %s\n", createAdminOpts.UserEmail)
	adminUser, err := createAdminUser(overlordURL, createAdminOpts.APIKey, dexUser{
		Email:            createAdminOpts.UserEmail,
		Password:         createAdminOpts.UserPassword,
		GeneratePassword: createAdminOpts.GeneratePassword,
	})
	if err != nil {
		if dexErrAlreadyExists(err) {
			return fmt.Errorf("admin user %s already exists, but secret storing ID is missing", createAdminOpts.UserEmail)
		}
		return fmt.Errorf("error occurred while creating admin user: %v", err)
	}
	logger.Println("successfully created admin user")

	logger.Printf("storing admin user ID in secret %s\n", secretName)
	err = createSecret(secretName, map[string][]byte{
		"admin-user-id": []byte(adminUser.Id),
	}, statefulLabel)
	if err != nil {
		return err
	}
	logger.Printf("successfully created secret %s\n", secretName)

	return nil
}

func waitUntilHealthy(endpoint string, maxAttempts int) bool {
	httpClient := http.DefaultClient
	httpClient.Timeout = time.Duration(defaultHealthCheckTimeout)

	attempts := 0
	for attempts < maxAttempts {
		attempts++
		logger.Printf("attempt %d/%d: checking health of %s\n", attempts, maxAttempts, endpoint)
		healthy := httpGet(nil, endpoint)
		if healthy {
			logger.Printf("got healthy response from %s\n", endpoint)
			return true
		}
		sleepDuration := time.Second * time.Duration(attempts)
		logger.Printf("%s not healthy yet, sleeping %s", endpoint, sleepDuration)
		time.Sleep(sleepDuration)
	}
	return false
}
