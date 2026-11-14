package main

import (
	"bufio"
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	authnv1 "k8s.io/api/authentication/v1"
	authzv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes/fake"
	k8stesting "k8s.io/client-go/testing"
)

// fakeCluster is an API server with three namespaces and three users:
// "admin-token" may read pod logs everywhere, "dev-token" only in team-a,
// "nobody-token" nowhere. Any other token is rejected.
type fakeCluster struct {
	client *fake.Clientset

	mu            sync.Mutex
	tokenReviews  int
	accessReviews []authzv1.ResourceAttributes
}

func newFakeCluster() *fakeCluster {
	c := &fakeCluster{}
	c.client = fake.NewClientset(
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "team-a"}},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "team-b"}},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "kube-system"}},
	)
	users := map[string]string{"admin-token": "admin", "dev-token": "dev", "nobody-token": "nobody"}
	c.client.PrependReactor("create", "tokenreviews", func(action k8stesting.Action) (bool, runtime.Object, error) {
		review := action.(k8stesting.CreateAction).GetObject().(*authnv1.TokenReview)
		c.mu.Lock()
		c.tokenReviews++
		c.mu.Unlock()
		if name, ok := users[review.Spec.Token]; ok {
			review.Status = authnv1.TokenReviewStatus{Authenticated: true, User: authnv1.UserInfo{Username: name, Groups: []string{"system:authenticated"}}}
		}
		return true, review, nil
	})
	c.client.PrependReactor("create", "subjectaccessreviews", func(action k8stesting.Action) (bool, runtime.Object, error) {
		review := action.(k8stesting.CreateAction).GetObject().(*authzv1.SubjectAccessReview)
		attrs := *review.Spec.ResourceAttributes
		c.mu.Lock()
		c.accessReviews = append(c.accessReviews, attrs)
		c.mu.Unlock()
		switch review.Spec.User {
		case "admin":
			review.Status.Allowed = true
		case "dev":
			review.Status.Allowed = attrs.Namespace == "team-a"
		}
		return true, review, nil
	})
	return c
}

// upstream records what reached VictoriaLogs.
type upstream struct {
	*httptest.Server
	mu       sync.Mutex
	requests []*http.Request
	forms    []url.Values
}

func newUpstream(t *testing.T) *upstream {
	u := &upstream{}
	u.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			t.Errorf("upstream: %v", err)
		}
		u.mu.Lock()
		u.requests = append(u.requests, r)
		u.forms = append(u.forms, r.PostForm)
		u.mu.Unlock()
		_, _ = w.Write([]byte(`{"_msg":"hello"}` + "\n"))
	}))
	t.Cleanup(u.Close)
	return u
}

func (u *upstream) last(t *testing.T) (*http.Request, url.Values) {
	t.Helper()
	u.mu.Lock()
	defer u.mu.Unlock()
	if len(u.requests) == 0 {
		t.Fatal("no request reached VictoriaLogs")
	}
	return u.requests[len(u.requests)-1], u.forms[len(u.forms)-1]
}

func (u *upstream) count() int {
	u.mu.Lock()
	defer u.mu.Unlock()
	return len(u.requests)
}

func newTestProxy(t *testing.T) (*httptest.Server, *upstream, *fakeCluster) {
	t.Helper()
	vl := newUpstream(t)
	cluster := newFakeCluster()
	vlURL, _ := url.Parse(vl.URL)
	proxy := httptest.NewServer(NewProxy(vlURL, NewAuthorizer(cluster.client, time.Minute), "namespace"))
	t.Cleanup(proxy.Close)
	return proxy, vl, cluster
}

func get(t *testing.T, rawURL, token string, header http.Header) *http.Response {
	t.Helper()
	req, _ := http.NewRequest(http.MethodGet, rawURL, nil)
	for k, v := range header {
		req.Header[k] = v
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { resp.Body.Close() })
	return resp
}

const appFilter = `{namespace!~"openshift-.*|openshift|default|kube-.*"}`

func TestAdminGetsOnlyTheTenantFilter(t *testing.T) {
	proxy, vl, _ := newTestProxy(t)

	resp := get(t, proxy.URL+"/api/logs/v1/application/select/logsql/query?query=error&limit=10", "admin-token", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	req, form := vl.last(t)
	if req.URL.Path != "/select/logsql/query" {
		t.Errorf("upstream path %q", req.URL.Path)
	}
	if form.Get("query") != "error" || form.Get("limit") != "10" {
		t.Errorf("query args not forwarded: %v", form)
	}
	if got := form["extra_stream_filters"]; !slices.Equal(got, []string{appFilter}) {
		t.Errorf("extra_stream_filters = %q", got)
	}
}

func TestInfrastructureTenant(t *testing.T) {
	proxy, vl, _ := newTestProxy(t)

	get(t, proxy.URL+"/api/logs/v1/infrastructure/select/logsql/hits?query=*", "admin-token", nil)
	_, form := vl.last(t)
	want := `{namespace=~"openshift-.*|openshift|default|kube-.*"}`
	if got := form["extra_stream_filters"]; !slices.Equal(got, []string{want}) {
		t.Errorf("extra_stream_filters = %q", got)
	}
}

func TestNamespaceLimitedUserIsRestricted(t *testing.T) {
	proxy, vl, cluster := newTestProxy(t)

	resp := get(t, proxy.URL+"/api/logs/v1/application/select/logsql/query?query=*", "dev-token", nil)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	_, form := vl.last(t)
	want := []string{appFilter, `{namespace in ("team-a")}`}
	if got := form["extra_stream_filters"]; !slices.Equal(got, want) {
		t.Errorf("extra_stream_filters = %q, want %q", got, want)
	}

	// One cluster-wide review, then one per namespace, all for get pods/log.
	if len(cluster.accessReviews) != 4 {
		t.Fatalf("%d access reviews, want 4", len(cluster.accessReviews))
	}
	for _, attrs := range cluster.accessReviews {
		if attrs.Verb != "get" || attrs.Resource != "pods" || attrs.Subresource != "log" {
			t.Errorf("unexpected review %+v", attrs)
		}
	}
	if cluster.accessReviews[0].Namespace != "" {
		t.Errorf("first review should be cluster-wide, got namespace %q", cluster.accessReviews[0].Namespace)
	}
}

func TestClientCannotOverrideFilters(t *testing.T) {
	proxy, vl, _ := newTestProxy(t)

	q := url.Values{
		"query":                {"*"},
		"extra_stream_filters": {`{namespace="team-b"} or *`},
		"extra_filters":        {`*`},
	}
	header := http.Header{"Accountid": {"7"}, "Projectid": {"7"}}
	get(t, proxy.URL+"/api/logs/v1/application/select/logsql/query?"+q.Encode(), "dev-token", header)

	req, form := vl.last(t)
	want := []string{appFilter, `{namespace in ("team-a")}`}
	if got := form["extra_stream_filters"]; !slices.Equal(got, want) {
		t.Errorf("extra_stream_filters = %q, want %q", got, want)
	}
	if _, ok := form["extra_filters"]; ok {
		t.Errorf("client extra_filters forwarded: %q", form["extra_filters"])
	}
	for _, h := range []string{"Authorization", "AccountID", "ProjectID", "Cookie"} {
		if v := req.Header.Get(h); v != "" {
			t.Errorf("header %s forwarded: %q", h, v)
		}
	}
}

func TestPostBodyIsSanitizedToo(t *testing.T) {
	proxy, vl, _ := newTestProxy(t)

	body := url.Values{"query": {"error"}, "extra_stream_filters": {`{namespace="team-b"}`}}.Encode()
	req, _ := http.NewRequest(http.MethodPost, proxy.URL+"/api/logs/v1/application/select/logsql/query?extra_filters=x", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", "Bearer dev-token")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()

	_, form := vl.last(t)
	if form.Get("query") != "error" {
		t.Errorf("query = %q", form.Get("query"))
	}
	want := []string{appFilter, `{namespace in ("team-a")}`}
	if got := form["extra_stream_filters"]; !slices.Equal(got, want) {
		t.Errorf("extra_stream_filters = %q, want %q", got, want)
	}
	if _, ok := form["extra_filters"]; ok {
		t.Error("client extra_filters forwarded")
	}
}

func TestRejections(t *testing.T) {
	proxy, vl, _ := newTestProxy(t)

	for _, tc := range []struct {
		name, path, token string
		status            int
	}{
		{"no token", "/api/logs/v1/application/select/logsql/query?query=*", "", http.StatusUnauthorized},
		{"invalid token", "/api/logs/v1/application/select/logsql/query?query=*", "stolen", http.StatusUnauthorized},
		{"no namespaces", "/api/logs/v1/application/select/logsql/query?query=*", "nobody-token", http.StatusForbidden},
		{"unknown tenant", "/api/logs/v1/audit/select/logsql/query?query=*", "admin-token", http.StatusNotFound},
		{"endpoint without extra filters", "/api/logs/v1/application/select/logsql/query_time_range?query=*", "admin-token", http.StatusNotFound},
		{"tenant listing", "/api/logs/v1/application/select/tenant_ids", "admin-token", http.StatusNotFound},
		{"ingestion", "/api/logs/v1/application/insert/loki/api/v1/push", "admin-token", http.StatusNotFound},
		{"path traversal", "/api/logs/v1/application/select/logsql/../../insert/jsonline", "admin-token", http.StatusNotFound},
		{"no tenant", "/select/logsql/query?query=*", "admin-token", http.StatusNotFound},
	} {
		t.Run(tc.name, func(t *testing.T) {
			resp := get(t, proxy.URL+tc.path, tc.token, nil)
			if resp.StatusCode != tc.status {
				t.Errorf("status %d, want %d", resp.StatusCode, tc.status)
			}
		})
	}
	if n := vl.count(); n != 0 {
		t.Errorf("%d rejected requests reached VictoriaLogs", n)
	}
}

func TestReviewsAreCached(t *testing.T) {
	proxy, _, cluster := newTestProxy(t)

	for range 3 {
		get(t, proxy.URL+"/api/logs/v1/application/select/logsql/query?query=*", "dev-token", nil)
	}
	if cluster.tokenReviews != 1 {
		t.Errorf("%d token reviews, want 1", cluster.tokenReviews)
	}
	if len(cluster.accessReviews) != 4 {
		t.Errorf("%d access reviews, want 4", len(cluster.accessReviews))
	}
}

func TestCacheExpires(t *testing.T) {
	cluster := newFakeCluster()
	authz := NewAuthorizer(cluster.client, time.Minute)
	now := time.Now()
	authz.now = func() time.Time { return now }

	ctx := context.Background()
	if _, err := authz.Authenticate(ctx, "admin-token"); err != nil {
		t.Fatal(err)
	}
	now = now.Add(2 * time.Minute)
	if _, err := authz.Authenticate(ctx, "admin-token"); err != nil {
		t.Fatal(err)
	}
	if cluster.tokenReviews != 2 {
		t.Errorf("%d token reviews after expiry, want 2", cluster.tokenReviews)
	}
}

func TestTailIsStreamed(t *testing.T) {
	release := make(chan struct{})
	vl := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"_msg":"first"}` + "\n"))
		w.(http.Flusher).Flush()
		<-release
		_, _ = w.Write([]byte(`{"_msg":"second"}` + "\n"))
	}))
	vlURL, _ := url.Parse(vl.URL)
	proxy := httptest.NewServer(NewProxy(vlURL, NewAuthorizer(newFakeCluster().client, time.Minute), "namespace"))
	resp := get(t, proxy.URL+"/api/logs/v1/application/select/logsql/tail?query=*", "admin-token", nil)
	defer func() {
		close(release)
		resp.Body.Close()
		proxy.Close()
		vl.Close()
	}()
	line := make(chan string, 1)
	go func() {
		s, _ := bufio.NewReader(resp.Body).ReadString('\n')
		line <- s
	}()
	select {
	case s := <-line:
		if !strings.Contains(s, "first") {
			t.Errorf("first line = %q", s)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("first tail line was not passed on before the upstream response ended")
	}
}

func TestNamespaceFilterSkipsInvalidNames(t *testing.T) {
	p := NewProxy(&url.URL{Scheme: "http", Host: "vl"}, nil, "namespace")
	if got := p.namespaceFilter([]string{`a"b`, "team-a", "Bad"}); got != `{namespace in ("team-a")}` {
		t.Errorf("filter = %q", got)
	}
	if got := p.namespaceFilter([]string{`x") or {a=~".*`}); got != "" {
		t.Errorf("filter = %q, want empty", got)
	}
}
