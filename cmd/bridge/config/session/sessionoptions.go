package session

import (
	"flag"
	"fmt"
	"os"

	utilerrors "k8s.io/apimachinery/pkg/util/errors"

	"github.com/openshift/console/pkg/serverconfig"
)

type SessionOptions struct {
	CookieEncryptionKeyPath     string
	CookieAuthenticationKeyPath string
}

type CompletedOptions struct {
	*completedOptions
}

type completedOptions struct {
	CookieEncryptionKey     []byte
	CookieAuthenticationKey []byte
}

func NewSessionOptions() *SessionOptions {
	return &SessionOptions{
		CookieEncryptionKeyPath:     "",
		CookieAuthenticationKeyPath: "",
	}
}

func (opts *SessionOptions) AddFlags(fs *flag.FlagSet) {
	fs.StringVar(&opts.CookieEncryptionKeyPath, "cookie-encryption-key-file", "", "Encryption key used to encrypt cookies. Must be set when --user-auth is 'oidc'.")
	fs.StringVar(&opts.CookieAuthenticationKeyPath, "cookie-authentication-key-file", "", "Authentication key used to sign cookies. Must be set when --user-auth is 'oidc'.")
}

func (opts *SessionOptions) ApplyConfig(config *serverconfig.Session) {
	serverconfig.SetIfUnset(&opts.CookieEncryptionKeyPath, config.CookieEncryptionKeyFile)
	serverconfig.SetIfUnset(&opts.CookieAuthenticationKeyPath, config.CookieAuthenticationKeyFile)
}

func (opts *SessionOptions) Validate(userAuthType string) []error {
	var errs []error

	switch userAuthType {
	case "oidc":
		if opts.CookieEncryptionKeyPath == "" || opts.CookieAuthenticationKeyPath == "" {
			errs = append(errs, fmt.Errorf("cookie-encryption-key-file and cookie-authentication-key-file must be set when --user-auth is 'oidc'"))
		}
	default:
		if opts.CookieEncryptionKeyPath != "" || opts.CookieAuthenticationKeyPath != "" {
			errs = append(errs, fmt.Errorf("cookie-encryption-key-file and cookie-authentication-key-file must not be set when --user-auth is not 'oidc'"))
		}
	}

	return errs
}

func (opts *SessionOptions) Complete(userAuthType string) (*CompletedOptions, error) {
	if errs := opts.Validate(userAuthType); len(errs) > 0 {
		return nil, utilerrors.NewAggregate(errs)
	}

	completed := &completedOptions{}

	if len(opts.CookieEncryptionKeyPath) > 0 {
		encKey, err := os.ReadFile(opts.CookieEncryptionKeyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to open cookie encryption key file %q: %w", opts.CookieEncryptionKeyPath, err)
		}
		completed.CookieEncryptionKey = encKey
	}

	if len(opts.CookieAuthenticationKeyPath) > 0 {
		authnKey, err := os.ReadFile(opts.CookieAuthenticationKeyPath)
		if err != nil {
			return nil, fmt.Errorf("failed to open cookie authentication key file %q: %w", opts.CookieAuthenticationKeyPath, err)
		}
		completed.CookieAuthenticationKey = authnKey
	}

	return &CompletedOptions{
		completedOptions: completed,
	}, nil
}
