package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	authnv1 "k8s.io/api/authentication/v1"
)

// accessChecker is implemented by Authorizer; tests substitute their own.
type accessChecker interface {
	Authenticate(ctx context.Context, token string) (*authnv1.UserInfo, error)
	Access(ctx context.Context, user *authnv1.UserInfo) (Access, error)
}

// infrastructureNamespaces is the namespace pattern LokiStack's gateway (and
// the plugin's namespace dropdown) treats as the "infrastructure" tenant.
const infrastructureNamespaces = `openshift-.*|openshift|default|kube-.*`

// requestPath matches /api/logs/v1/<tenant>/select/logsql/<endpoint>, the
// LokiStack gateway's path layout with VictoriaLogs' query endpoints after the
// tenant. Only endpoints that apply extra_stream_filters are listed:
// query_time_range, tenant_ids, vmui and /insert are not reachable.
var requestPath = regexp.MustCompile(`^/api/logs/v1/([a-z]+)(/select/logsql/(?:query|hits|facets|field_names|field_values|stream_field_names|stream_field_values|streams|stats_query|stats_query_range|tail))$`)

// dnsLabel is a Kubernetes namespace name; anything else is never put in a filter.
var dnsLabel = regexp.MustCompile(`^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`)

// clientOnlyParams are VictoriaLogs query args the proxy owns. Client values
// are dropped; the proxy sets extra_stream_filters itself.
var clientOnlyParams = []string{"extra_filters", "extra_stream_filters"}

type formKey struct{}

// Proxy forwards LogsQL queries to VictoriaLogs, restricted to the namespaces
// the caller may read pod logs in.
type Proxy struct {
	access         accessChecker
	namespaceField string
	tenants        map[string]string
	reverseProxy   *httputil.ReverseProxy
}

func NewProxy(upstream *url.URL, access accessChecker, namespaceField string) *Proxy {
	p := &Proxy{
		access:         access,
		namespaceField: namespaceField,
		tenants: map[string]string{
			"application":    fmt.Sprintf(`{%s!~%q}`, namespaceField, infrastructureNamespaces),
			"infrastructure": fmt.Sprintf(`{%s=~%q}`, namespaceField, infrastructureNamespaces),
		},
	}
	p.reverseProxy = &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			form := pr.In.Context().Value(formKey{}).(url.Values)
			body := form.Encode()

			pr.Out.URL.Scheme = upstream.Scheme
			pr.Out.URL.Host = upstream.Host
			pr.Out.URL.Path = strings.TrimSuffix(upstream.Path, "/") + requestPath.FindStringSubmatch(pr.In.URL.Path)[2]
			pr.Out.URL.RawPath = ""
			pr.Out.URL.RawQuery = ""
			pr.Out.Host = upstream.Host
			pr.Out.Method = http.MethodPost
			pr.Out.Body = io.NopCloser(strings.NewReader(body))
			pr.Out.GetBody = func() (io.ReadCloser, error) { return io.NopCloser(strings.NewReader(body)), nil }
			pr.Out.ContentLength = int64(len(body))
			// Forward no client headers: not the bearer token, and not
			// AccountID/ProjectID, which would select another VictoriaLogs tenant.
			pr.Out.Header = http.Header{}
			pr.Out.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			pr.Out.Header.Set("Content-Length", strconv.Itoa(len(body)))
		},
		// Live tailing streams lines; pass each one on as soon as it arrives.
		FlushInterval: -1,
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			slog.Error("upstream request failed", "path", r.URL.Path, "err", err)
			http.Error(w, "VictoriaLogs is unreachable", http.StatusBadGateway)
		},
	}
	return p
}

func (p *Proxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	match := requestPath.FindStringSubmatch(r.URL.Path)
	if match == nil {
		http.NotFound(w, r)
		return
	}
	tenant := match[1]
	tenantFilter, ok := p.tenants[tenant]
	if !ok {
		http.Error(w, fmt.Sprintf("unknown tenant %q", tenant), http.StatusNotFound)
		return
	}
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		w.Header().Set("Allow", "GET, POST")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
	if !ok || token == "" {
		http.Error(w, "a bearer token is required", http.StatusUnauthorized)
		return
	}
	user, err := p.access.Authenticate(r.Context(), token)
	if errors.Is(err, errUnauthenticated) {
		http.Error(w, "the bearer token is not valid", http.StatusUnauthorized)
		return
	}
	if err != nil {
		slog.Error("authentication failed", "err", err)
		http.Error(w, "cannot verify the bearer token", http.StatusBadGateway)
		return
	}
	access, err := p.access.Access(r.Context(), user)
	if err != nil {
		slog.Error("authorization failed", "user", user.Username, "err", err)
		http.Error(w, "cannot check log access", http.StatusBadGateway)
		return
	}

	// r.Form holds the URL query and, for POST, the urlencoded body.
	if err := r.ParseForm(); err != nil {
		http.Error(w, "invalid query arguments", http.StatusBadRequest)
		return
	}
	form := url.Values{}
	for k, v := range r.Form {
		form[k] = v
	}
	for _, k := range clientOnlyParams {
		form.Del(k)
	}
	form.Add("extra_stream_filters", tenantFilter)

	scope := "all namespaces"
	if !access.All {
		filter := p.namespaceFilter(access.Namespaces)
		if filter == "" {
			slog.Info("denied", "user", user.Username, "tenant", tenant, "endpoint", match[2])
			http.Error(w, "you cannot read pod logs in any namespace", http.StatusForbidden)
			return
		}
		form.Add("extra_stream_filters", filter)
		scope = fmt.Sprintf("%d namespaces", len(access.Namespaces))
	}
	slog.Info("query", "user", user.Username, "tenant", tenant, "endpoint", match[2], "scope", scope)

	p.reverseProxy.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), formKey{}, form)))
}

// namespaceFilter returns a stream filter matching only namespaces, or "" when
// none is a valid namespace name.
func (p *Proxy) namespaceFilter(namespaces []string) string {
	quoted := make([]string, 0, len(namespaces))
	for _, ns := range namespaces {
		if dnsLabel.MatchString(ns) {
			quoted = append(quoted, strconv.Quote(ns))
		}
	}
	if len(quoted) == 0 {
		return ""
	}
	return fmt.Sprintf("{%s in (%s)}", p.namespaceField, strings.Join(quoted, ","))
}
