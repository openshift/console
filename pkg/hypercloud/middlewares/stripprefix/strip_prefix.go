package stripprefix

import (
	"context"
	"net/http"
	"strings"

	"github.com/openshift/console/pkg/hypercloud/config"
	log "github.com/sirupsen/logrus"
)

const (
	// ForwardedPrefixHeader is the default header to set prefix.
	ForwardedPrefixHeader = "X-Forwarded-Prefix"
	typeName              = "StripPrefix"
)

type stripPrefix struct {
	next     http.Handler
	prefixes []string
	name     string
}

func New(ctx context.Context, next http.Handler, config config.StripPrefix, name string) (http.Handler, error) {
	log.Infof("Creating stripPrefix middleware")
	return &stripPrefix{
		next:     next,
		prefixes: config.Prefixes,
		name:     name,
	}, nil
}

func (s *stripPrefix) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	for _, prefix := range s.prefixes {
		if strings.HasPrefix(req.URL.Path, prefix) {
			req.URL.Path = s.getPrefixStripped(req.URL.Path, prefix)
			if req.URL.RawPath != "" {
				req.URL.RawPath = s.getPrefixStripped(req.URL.RawPath, prefix)
			}
			req.Header.Add(ForwardedPrefixHeader, prefix)
			req.RequestURI = req.URL.RequestURI()
			s.next.ServeHTTP(w, req)
			return
		}
	}
	s.next.ServeHTTP(w, req)
}

func (s *stripPrefix) getPrefixStripped(urlPath, prefix string) string {
	return ensureLeadingSlash(strings.TrimPrefix(urlPath, prefix))
}

func ensureLeadingSlash(str string) string {
	if str == "" {
		return str
	}

	if str[0] == '/' {
		return str
	}

	return "/" + str
}
