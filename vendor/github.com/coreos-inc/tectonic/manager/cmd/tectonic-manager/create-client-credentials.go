package main

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/coreos/dex/schema/adminschema"
	"github.com/pborman/uuid"
	"github.com/spf13/cobra"
)

const (
	consoleDexClientID               = "tectonic-console"
	kubectlDexClientID               = "tectonic-kubectl"
	secretDataKeyConsoleClientID     = "console-client-id"
	secretDataKeyConsoleClientSecret = "console-client-secret"
	secretDataKeyKubectlClientID     = "kubectl-client-id"
	secretDataKeyKubectlClientSecret = "kubectl-client-secret"
)

var createClientCredentialsCmd = &cobra.Command{
	Use:   "create-client-credentials [redirect-urls]",
	Short: "create the OIDC client_id and client_secrets for Tectonic",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runCreateClientCredentials(args)
	},
	SilenceUsage: true,
}

func init() {
	RootCmd.AddCommand(createClientCredentialsCmd)

	createClientCredentialsCmd.Flags().StringVar(&createClientCredentialsOpts.APIKey, "api-key", "", "")
	createClientCredentialsCmd.Flags().StringVar(&createClientCredentialsOpts.OverlordURL, "overlord-url", "", "")
	createClientCredentialsCmd.Flags().StringVar(&createClientCredentialsOpts.ConsoleClientCredsSecret, "console-client-creds-secret", "console-client-credentials", "")
	createClientCredentialsCmd.Flags().StringVar(&createClientCredentialsOpts.KubectlClientCredsSecret, "kubectl-client-creds-secret", "kubectl-client-credentials", "")
	createClientCredentialsCmd.Flags().BoolVar(&createClientCredentialsOpts.InferRedirectURLs, "infer-redirect-urls", true, "Infer the console redirect URLs from the URL provided as the first argument")
}

var createClientCredentialsOpts struct {
	KubectlClientCredsSecret string
	ConsoleClientCredsSecret string
	InferRedirectURLs        bool
	APIKey                   string
	OverlordURL              string
}

func runCreateClientCredentials(args []string) error {
	if createClientCredentialsOpts.OverlordURL == "" {
		return errors.New("overlord-url cannot be empty")
	}
	if createClientCredentialsOpts.APIKey == "" {
		return errors.New("api-key cannot be empty")
	}

	err := createConsoleCreds(args)
	if err != nil {
		return fmt.Errorf("unable to create console client credentials: %s", err)
	}
	err = createKubectlCreds()
	if err != nil {
		return fmt.Errorf("unable to create kubectl client credentials: %s", err)
	}
	return nil
}

func createKubectlCreds() error {
	overlordURL, overlordHealthURL, err := getOverlordURLs()
	if err != nil {
		return err
	}

	secretName := createClientCredentialsOpts.KubectlClientCredsSecret
	logger.Printf("checking if secret %s exists", secretName)
	exists, err := checkSecretExists(secretName)
	if err != nil {
		return err
	} else if exists {
		logger.Printf("secret %s exists, using existing clientID and clientSecret", secretName)
		return nil
	}

	healthy := waitUntilHealthy(overlordHealthURL, 10)
	if !healthy {
		return fmt.Errorf("%s service did not become healthy after 10 attempts", overlordHealthURL)
	}

	kubectlDexClientSecret := uuid.NewUUID().String()
	logger.Printf("attempting to create new client %s via dex admin API", kubectlDexClientID)
	_, err = createDexClient(overlordURL, createClientCredentialsOpts.APIKey, &adminschema.Client{
		Id:           kubectlDexClientID,
		Secret:       kubectlDexClientSecret,
		ClientName:   "Tectonic Kubectl",
		Public:       true,
		TrustedPeers: []string{consoleDexClientID},
	})
	if err != nil {
		if dexErrAlreadyExists(err) {
			return errClientExistsNoSecret(kubectlDexClientID)
		}
		return fmt.Errorf("unable to create client credentials: %v", err)
	}
	logger.Printf("successfully created client %s via dex admin API", kubectlDexClientID)

	logger.Printf("attempting to create secret %s\n", secretName)
	err = createSecret(secretName, map[string][]byte{
		secretDataKeyKubectlClientID:     []byte(kubectlDexClientID),
		secretDataKeyKubectlClientSecret: []byte(kubectlDexClientSecret),
	}, statefulLabel)
	if err != nil {
		return err
	}
	logger.Printf("successfully created secret %s\n", secretName)

	return nil
}

func createConsoleCreds(args []string) error {
	if len(args) < 1 {
		return fmt.Errorf("Provide at least one redirect URL.")
	}

	overlordURL, overlordHealthURL, err := getOverlordURLs()
	if err != nil {
		return err
	}

	var redirectURLs []url.URL
	if createClientCredentialsOpts.InferRedirectURLs {
		urlRaw := strings.TrimRight(args[0], "/")
		rootURL, err := url.Parse(urlRaw)
		if err != nil {
			return err
		}
		callbackURL, err := rootURL.Parse("/auth/callback")
		if err != nil {
			return err
		}
		redirectURLs = []url.URL{
			*rootURL,     // foo.com
			*callbackURL, // foo.com/auth/callback
		}
	} else {
		for _, ua := range args {
			u, err := url.Parse(ua)
			if err != nil {
				return fmt.Errorf("Malformed URL %q: %v", ua, err)
			}
			redirectURLs = append(redirectURLs, *u)
		}
	}
	var urls []string
	for _, u := range redirectURLs {
		urls = append(urls, u.String())
	}
	logger.Printf("using %s as redirect URLS", strings.Join(urls, ", "))

	httpClient := http.DefaultClient
	httpClient.Timeout = time.Duration(defaultHealthCheckTimeout)

	secretName := createClientCredentialsOpts.ConsoleClientCredsSecret
	logger.Printf("checking if secret %s exists", secretName)
	exists, err := checkSecretExists(secretName)
	if err != nil {
		return err
	} else if exists {
		logger.Printf("secret %s exists, using existing clientID and clientSecret", secretName)
		return nil
	}

	healthy := waitUntilHealthy(overlordHealthURL, 10)
	if !healthy {
		return fmt.Errorf("%s service did not become healthy after 10 attempts", overlordHealthURL)
	}

	consoleDexClientSecret := uuid.NewUUID().String()
	logger.Printf("attempting to create new client %s via dex admin API", consoleDexClientID)
	_, err = createDexClient(overlordURL, createClientCredentialsOpts.APIKey, &adminschema.Client{
		Id:           consoleDexClientID,
		Secret:       consoleDexClientSecret,
		ClientName:   "Tectonic Console",
		IsAdmin:      true,
		RedirectURIs: urls,
	})
	if err != nil {
		if dexErrAlreadyExists(err) {
			return errClientExistsNoSecret(consoleDexClientID)
		}
		return fmt.Errorf("unable to create client credentials: %v", err)
	}
	logger.Printf("successfully created client %s via dex admin API", consoleDexClientID)

	logger.Printf("attempting to create secret %s\n", secretName)
	err = createSecret(secretName, map[string][]byte{
		secretDataKeyConsoleClientID:     []byte(consoleDexClientID),
		secretDataKeyConsoleClientSecret: []byte(consoleDexClientSecret),
	}, statefulLabel)
	if err != nil {
		return err
	}
	logger.Printf("successfully created secret %s\n", secretName)

	return nil
}

// getOverlordURLS validates and returns the overlord API endpoint and the
// overlord health endpoint based on what was provided as a flag/environment
// variable.  It returns an error if it's unable to parse the configured URL.
func getOverlordURLs() (string, string, error) {
	overlordURL, err := url.Parse(createAdminOpts.OverlordURL)
	if err != nil {
		return "", "", fmt.Errorf("invalid overlord URL: %v", err)
	}
	overlordHealthURL, err := overlordURL.Parse("/health")
	if err != nil {
		return "", "", fmt.Errorf("invalid overlord URL: %v", err)
	}
	return overlordURL.String(), overlordHealthURL.String(), nil
}

func errClientExistsNoSecret(clientID string) error {
	return fmt.Errorf("client with ID '%s' already exists in Dex, but secret containing clientID and clientSecret does not, err: %s", clientID)
}
