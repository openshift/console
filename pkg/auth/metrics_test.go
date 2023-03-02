package auth

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/openshift/console/pkg/metrics"
	"github.com/stretchr/testify/assert"
	"k8s.io/client-go/rest"
)

func TestDefaultMetrics(t *testing.T) {
	m := NewMetrics()

	assert.Equal(t,
		metrics.RemoveComments(`
		console_auth_login_failures_total{reason="unknown"} 0
		console_auth_login_requests_total 0
		console_auth_login_successes_total{role="cluster-admin"} 0
		console_auth_login_successes_total{role="developer"} 0
		console_auth_login_successes_total{role="kubeadmin"} 0
		console_auth_logout_requests_total{reason="unknown"} 0
		`),
		metrics.RemoveComments(metrics.FormatMetrics(m.GetCollectors()...)),
	)
}

func TestLoginRequested(t *testing.T) {
	m := NewMetrics()
	m.LoginRequested()

	assert.Equal(t,
		metrics.RemoveComments(`
		console_auth_login_requests_total 1
		`),
		metrics.RemoveComments(metrics.FormatMetrics(m.loginRequests)),
	)
}

func TestLoginSuccessful(t *testing.T) {
	testcases := []struct {
		name            string
		handler         http.Handler
		expectedMetrics string
	}{
		{
			name: "api-failures",
			handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				w.WriteHeader(http.StatusNotFound)
			}),
			expectedMetrics: `
			console_auth_login_successes_total{role="cluster-admin"} 0
			console_auth_login_successes_total{role="developer"} 0
			console_auth_login_successes_total{role="kubeadmin"} 0
			console_auth_login_successes_total{role="unknown"} 1
			`,
		},
		{
			name: "developer",
			handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				if r.URL.Path == "/apis/user.openshift.io/v1/users/~" {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{ "kind": "User", "metadata": { "name": "developer1", "uid": "1234" } }`))
				} else if r.URL.Path == "/apis/authorization.k8s.io/v1/selfsubjectaccessreviews" {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{ "status": { "allowed": false } }`))
				} else {
					w.WriteHeader(http.StatusNotFound)
				}
			}),
			expectedMetrics: `
			console_auth_login_successes_total{role="cluster-admin"} 0
			console_auth_login_successes_total{role="developer"} 1
			console_auth_login_successes_total{role="kubeadmin"} 0
			`,
		},
		{
			name: "clusteradmin",
			handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				if r.URL.Path == "/apis/user.openshift.io/v1/users/~" {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{ "kind": "User", "metadata": { "name": "clusteradmin1", "uid": "1234" } }`))
				} else if r.URL.Path == "/apis/authorization.k8s.io/v1/selfsubjectaccessreviews" {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{ "status": { "allowed": true } }`))
				} else {
					w.WriteHeader(http.StatusNotFound)
				}
			}),
			expectedMetrics: `
			console_auth_login_successes_total{role="cluster-admin"} 1
			console_auth_login_successes_total{role="developer"} 0
			console_auth_login_successes_total{role="kubeadmin"} 0
			`,
		},
		{
			name: "kubeadmin",
			handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				if r.URL.Path == "/apis/user.openshift.io/v1/users/~" {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{ "kind": "User", "metadata": { "name": "kube:admin", "uid": "" } }`))
				} else if r.URL.Path == "/apis/authorization.k8s.io/v1/selfsubjectaccessreviews" {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusOK)
					w.Write([]byte(`{ "status": { "allowed": true } }`))
				} else {
					w.WriteHeader(http.StatusNotFound)
				}
			}),
			expectedMetrics: `
			console_auth_login_successes_total{role="cluster-admin"} 0
			console_auth_login_successes_total{role="developer"} 0
			console_auth_login_successes_total{role="kubeadmin"} 1
			`,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			testserver := httptest.NewServer(testcase.handler)
			defer testserver.Close()

			k8sConfig := &rest.Config{
				Host: strings.TrimPrefix(testserver.URL, "http://"),
			}
			ls := &loginState{
				rawToken: testcase.name,
			}

			m := NewMetrics()
			m.loginSuccessfulSync(k8sConfig, ls)

			assert.Equal(t,
				metrics.RemoveComments(testcase.expectedMetrics),
				metrics.RemoveComments(metrics.FormatMetrics(m.loginSuccessful)),
			)
		})
	}
}

func TestLoginFailed(t *testing.T) {
	m := NewMetrics()
	m.LoginFailed(UnknownLoginFailureReason)

	assert.Equal(t,
		metrics.RemoveComments(`
		console_auth_login_failures_total{reason="unknown"} 1
		`),
		metrics.RemoveComments(metrics.FormatMetrics(m.loginFailures)),
	)
}

func TestLogoutRequests(t *testing.T) {
	m := NewMetrics()
	m.LogoutRequested(UnknownLogoutReason)

	assert.Equal(t,
		metrics.RemoveComments(`
		console_auth_logout_requests_total{reason="unknown"} 1
		`),
		metrics.RemoveComments(metrics.FormatMetrics(m.logoutRequests)),
	)
}
