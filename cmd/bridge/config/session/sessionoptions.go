package session

import (
	"flag"
	"fmt"
	"os"

	utilerrors "k8s.io/apimachinery/pkg/util/errors"
	"k8s.io/klog/v2"

	"github.com/openshift/console/cmd/bridge/config/flagvalues"
	"github.com/openshift/console/pkg/serverconfig"
)

type SessionOptions struct {
	CookieEncryptionKeyPath             string
	CookieAuthenticationKeyPath         string
	PreviousCookieEncryptionKeyPath     string
	PreviousCookieAuthenticationKeyPath string
}

type CompletedOptions struct {
	*completedOptions
}

type completedOptions struct {
	CookieEncryptionKey             []byte
	CookieAuthenticationKey         []byte
	PreviousCookieEncryptionKey     []byte
	PreviousCookieAuthenticationKey []byte
}

func NewSessionOptions() *SessionOptions {
	return &SessionOptions{}
}

func (opts *SessionOptions) AddFlags(fs *flag.FlagSet) {
	fs.StringVar(&opts.CookieEncryptionKeyPath, "cookie-encryption-key-file", "", "Encryption key used to encrypt cookies. Required when --user-auth is 'oidc', optional when 'openshift'.")
	fs.StringVar(&opts.CookieAuthenticationKeyPath, "cookie-authentication-key-file", "", "Authentication key used to sign cookies. Required when --user-auth is 'oidc', optional when 'openshift'.")
}

func (opts *SessionOptions) ApplyConfig(config *serverconfig.Session) {
	serverconfig.SetIfUnset(&opts.CookieEncryptionKeyPath, config.CookieEncryptionKeyFile)
	serverconfig.SetIfUnset(&opts.CookieAuthenticationKeyPath, config.CookieAuthenticationKeyFile)
	serverconfig.SetIfUnset(&opts.PreviousCookieEncryptionKeyPath, config.PreviousCookieEncryptionKeyFile)
	serverconfig.SetIfUnset(&opts.PreviousCookieAuthenticationKeyPath, config.PreviousCookieAuthenticationKeyFile)
}

func (opts *SessionOptions) Validate(userAuthType flagvalues.AuthType) []error {
	var errs []error

	switch userAuthType {
	case flagvalues.AuthTypeOIDC:
		if opts.CookieEncryptionKeyPath == "" || opts.CookieAuthenticationKeyPath == "" {
			errs = append(errs, fmt.Errorf("cookie-encryption-key-file and cookie-authentication-key-file must be set when --user-auth is 'oidc'"))
		}
	case flagvalues.AuthTypeOpenShift:
		bothSet := opts.CookieEncryptionKeyPath != "" && opts.CookieAuthenticationKeyPath != ""
		neitherSet := opts.CookieEncryptionKeyPath == "" && opts.CookieAuthenticationKeyPath == ""
		if !bothSet && !neitherSet {
			errs = append(errs, fmt.Errorf("cookie-encryption-key-file and cookie-authentication-key-file must both be set or both be unset when --user-auth is 'openshift'"))
		}
	default:
		if opts.CookieEncryptionKeyPath != "" || opts.CookieAuthenticationKeyPath != "" {
			errs = append(errs, fmt.Errorf("cookie-encryption-key-file and cookie-authentication-key-file must not be set when --user-auth is not 'oidc' or 'openshift'"))
		}
	}

	return errs
}

func (opts *SessionOptions) Complete(userAuthType flagvalues.AuthType) (*CompletedOptions, error) {
	if errs := opts.Validate(userAuthType); len(errs) > 0 {
		return nil, utilerrors.NewAggregate(errs)
	}

	completed := &completedOptions{}

	if len(opts.CookieEncryptionKeyPath) > 0 {
		encKey, err := os.ReadFile(opts.CookieEncryptionKeyPath)
		if err != nil {
			if userAuthType == flagvalues.AuthTypeOpenShift {
				klog.Warningf("could not read cookie encryption key file %q, falling back to random keys: %v", opts.CookieEncryptionKeyPath, err)
			} else {
				return nil, fmt.Errorf("failed to open cookie encryption key file %q: %w", opts.CookieEncryptionKeyPath, err)
			}
		} else {
			completed.CookieEncryptionKey = encKey
		}
	}

	if len(opts.CookieAuthenticationKeyPath) > 0 {
		authnKey, err := os.ReadFile(opts.CookieAuthenticationKeyPath)
		if err != nil {
			if userAuthType == flagvalues.AuthTypeOpenShift {
				klog.Warningf("could not read cookie authentication key file %q, falling back to random keys: %v", opts.CookieAuthenticationKeyPath, err)
			} else {
				return nil, fmt.Errorf("failed to open cookie authentication key file %q: %w", opts.CookieAuthenticationKeyPath, err)
			}
		} else {
			completed.CookieAuthenticationKey = authnKey
		}
	}

	// Previous keys are optional — used for graceful key rotation.
	// If configured, both must be readable; an incomplete pair would
	// silently break decryption of cookies encrypted with the prior keys.
	if len(opts.PreviousCookieEncryptionKeyPath) > 0 || len(opts.PreviousCookieAuthenticationKeyPath) > 0 {
		var prevEncKey, prevAuthnKey []byte
		var prevErrs []error

		if len(opts.PreviousCookieEncryptionKeyPath) > 0 {
			key, err := os.ReadFile(opts.PreviousCookieEncryptionKeyPath)
			if err != nil {
				prevErrs = append(prevErrs, fmt.Errorf("failed to read previous cookie encryption key file %q: %w", opts.PreviousCookieEncryptionKeyPath, err))
			} else {
				prevEncKey = key
			}
		}
		if len(opts.PreviousCookieAuthenticationKeyPath) > 0 {
			key, err := os.ReadFile(opts.PreviousCookieAuthenticationKeyPath)
			if err != nil {
				prevErrs = append(prevErrs, fmt.Errorf("failed to read previous cookie authentication key file %q: %w", opts.PreviousCookieAuthenticationKeyPath, err))
			} else {
				prevAuthnKey = key
			}
		}

		if len(prevErrs) > 0 {
			klog.Warningf("ignoring previous session keys due to errors: %v", utilerrors.NewAggregate(prevErrs))
		} else if prevEncKey != nil && prevAuthnKey != nil {
			completed.PreviousCookieEncryptionKey = prevEncKey
			completed.PreviousCookieAuthenticationKey = prevAuthnKey
		}
	}

	return &CompletedOptions{
		completedOptions: completed,
	}, nil
}
