package server

import (
	"context"
	"errors"
	"net/http"
	"net/url"
)

type contextKey int

const federationConfigKey = contextKey(0)

// federationConfigFromContext returns the federation configuration from a given context.
func federationConfigFromContext(ctx context.Context) (*federationConfig, error) {
	f, ok := ctx.Value(federationConfigKey).(*federationConfig)
	if !ok {
		return nil, errors.New("the given context has no federation config value")
	}
	return f, nil
}

// withFederationConfig returns a copy of the given context with the federation configuration added.
func withFederationConfig(ctx context.Context, r *http.Request) (context.Context, error) {
	urlString := r.Header.Get("X-Tectonic-Federation-Url")
	if urlString == "" {
		return nil, errors.New("request must include a url")
	}

	u, err := url.Parse(urlString)
	if err != nil {
		return nil, errors.New("failed to parse federation apiserver url")
	}

	token := r.Header.Get("X-Tectonic-Federation-Token")
	if token == "" {
		return nil, errors.New("request must include a token")
	}
	f := federationConfig{
		token: token,
		url:   u,
	}
	return context.WithValue(ctx, federationConfigKey, &f), nil
}
