package httpclient

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"golang.org/x/net/http/httpproxy"
	kerrors "k8s.io/apimachinery/pkg/util/errors"
)

// ProxyConfig contains the component proxy settings, without environment defaults.
type ProxyConfig struct {
	HTTPProxy         string
	HTTPSProxy        string
	NoProxy           []string
	TrustedCAFilePath string
}

// parseProxy mirrors httpproxy's support for URLs and bare host:port addresses.
func parseProxy(value string) (*url.URL, error) {
	parsed, err := url.Parse(value)
	if (err != nil || parsed.Host == "" || parsed.Scheme == "") && !strings.Contains(value, "://") {
		parsed, err = url.Parse("http://" + value)
	}
	if err != nil {
		return nil, errors.New("invalid proxy URL")
	}
	if parsed.Host == "" {
		// Do not include the value or parse error: either may contain credentials.
		return nil, errors.New("expected a proxy URL with a non-empty host")
	}
	return parsed, nil
}

// Validate rejects proxy URLs that httpproxy would silently ignore.
func (c *ProxyConfig) Validate() error {
	var errs []error
	for _, setting := range []struct{ name, value string }{
		{"httpProxy", c.HTTPProxy},
		{"httpsProxy", c.HTTPSProxy},
	} {
		if setting.value != "" {
			if _, err := parseProxy(setting.value); err != nil {
				errs = append(errs, fmt.Errorf("auth.proxy.%s: %w", setting.name, err))
			}
		}
	}
	return kerrors.NewAggregate(errs)
}

// ProxyFunc returns an explicit proxy resolver, including for an empty config.
// A nil config preserves the standard environment proxy behavior.
func (c *ProxyConfig) ProxyFunc() func(*http.Request) (*url.URL, error) {
	if c == nil {
		return http.ProxyFromEnvironment
	}
	inner := (&httpproxy.Config{
		HTTPProxy: c.HTTPProxy, HTTPSProxy: c.HTTPSProxy,
		NoProxy: strings.Join(c.NoProxy, ","),
	}).ProxyFunc()
	return func(r *http.Request) (*url.URL, error) { return inner(r.URL) }
}

// String describes the effective settings without exposing URL credentials.
func (c *ProxyConfig) String() string {
	redact := func(value string) string {
		if value == "" {
			return ""
		}
		parsed, err := parseProxy(value)
		if err != nil {
			return "<invalid>"
		}
		parsed.User = nil
		return parsed.String()
	}
	return fmt.Sprintf("httpProxy=%q httpsProxy=%q noProxy=%q trustedCAFilePath=%q",
		redact(c.HTTPProxy), redact(c.HTTPSProxy), c.NoProxy, c.TrustedCAFilePath)
}
