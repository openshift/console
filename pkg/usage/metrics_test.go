package usage

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	authv1 "k8s.io/api/authorization/v1"
	rbac "k8s.io/api/rbac/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	"github.com/openshift/console/pkg/metrics"
	"github.com/stretchr/testify/assert"
)

func init() {
	delayBetweenConsoleUserPermissionChecks = 0
}

func TestDefaultUsageMetrics(t *testing.T) {
	m := NewMetrics()
	assert.Equal(t,
		metrics.RemoveComments(`
		console_usage_total{event="page_impression",perspective="admin"} 0
		console_usage_total{event="page_impression",perspective="dev"} 0
		console_usage_total{event="page_view",perspective="admin"} 0
		console_usage_total{event="page_view",perspective="dev"} 0
		`),
		metrics.RemoveComments(metrics.FormatMetrics(m.GetCollectors()...)),
	)
}

func TestPageImpressionsAndViewsMetrics(t *testing.T) {
	m := NewMetrics()
	for i := 0; i < 1; i++ {
		assert.NoError(t, m.HandleUsage("page_impression", "admin"))
	}
	for i := 0; i < 2; i++ {
		assert.NoError(t, m.HandleUsage("page_impression", "dev"))
	}
	for i := 0; i < 3; i++ {
		assert.NoError(t, m.HandleUsage("page_view", "admin"))
	}
	for i := 0; i < 4; i++ {
		assert.NoError(t, m.HandleUsage("page_view", "dev"))
	}
	assert.Equal(t,
		metrics.RemoveComments(`
		console_usage_total{event="page_impression",perspective="admin"} 1
		console_usage_total{event="page_impression",perspective="dev"} 2
		console_usage_total{event="page_view",perspective="admin"} 3
		console_usage_total{event="page_view",perspective="dev"} 4
		`),
		metrics.RemoveComments(metrics.FormatMetrics(m.usageTotal)),
	)
}

func TestUsersMetrics(t *testing.T) {
	testcases := []struct {
		name            string
		handler         http.Handler
		expectedError   string
		expectedMetrics string
	}{
		{
			name: "get-rolebindings-fails",
			handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				w.WriteHeader(http.StatusNotFound)
			}),
			expectedError:   "the server could not find the requested resource (get rolebindings.rbac.authorization.k8s.io)",
			expectedMetrics: "",
		},
		{
			name: "can-get-namespaces-fails",
			handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				if r.URL.Path == "/apis/rbac.authorization.k8s.io/v1/namespaces/openshift-console-user-settings/rolebindings" {
					w.Header().Set("Content-Type", "application/json")

					roleBindingList := rbac.RoleBindingList{
						Items: []rbac.RoleBinding{
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-unknown-user-role-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "unknown-user-role",
									},
								},
							},
						},
					}

					if res, err := json.Marshal(roleBindingList); err != nil {
						w.WriteHeader(http.StatusInternalServerError)
						w.Write([]byte(err.Error()))
					} else {
						w.WriteHeader(http.StatusOK)
						w.Write(res)
					}
				} else {
					w.WriteHeader(http.StatusNotFound)
				}
			}),
			expectedMetrics: `
			console_usage_users{role="unknown"} 1
			`,
		},
		{
			name: "kubeadmin-and-two-cluster-admins-and-three-developers",
			handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				if r.URL.Path == "/apis/rbac.authorization.k8s.io/v1/namespaces/openshift-console-user-settings/rolebindings" {
					roleBindingList := rbac.RoleBindingList{
						Items: []rbac.RoleBinding{
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-kubeadmin-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "kube:admin",
									},
								},
							},
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-clusteradmin1-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "clusteradmin1",
									},
								},
							},
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-clusteradmin2-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "clusteradmin2",
									},
								},
							},
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-developer1-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "developer1",
									},
								},
							},
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-developer2-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "developer2",
									},
								},
							},
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-developer3-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "developer3",
									},
								},
							},
							// This rolebinding with two subjects will be count as unknown
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-both-developers-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "developer1",
									},
									{
										Kind: "User",
										Name: "developer2",
									},
								},
							},
							// This rolebinding with an unexpected resource name will be ignored
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "another-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "developer1",
									},
								},
							},
						},
					}

					if res, err := json.Marshal(roleBindingList); err != nil {
						w.WriteHeader(http.StatusInternalServerError)
						w.Write([]byte(err.Error()))
					} else {
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(http.StatusOK)
						w.Write(res)
					}
				} else if r.Method == http.MethodPost && r.URL.Path == "/apis/authorization.k8s.io/v1/subjectaccessreviews" {
					var accessReviewReq authv1.SubjectAccessReview
					err := json.NewDecoder(r.Body).Decode(&accessReviewReq)
					if err != nil {
						w.WriteHeader(http.StatusBadRequest)
						w.Write([]byte(fmt.Sprintf("Unexpected request: %s", err)))
						return
					}

					// Fail for unexpected users, even kubeadmin
					username := accessReviewReq.Spec.User
					if !strings.HasPrefix(username, "clusteradmin") && !strings.HasPrefix(username, "developer") {
						w.WriteHeader(http.StatusInternalServerError)
						w.Write([]byte(fmt.Sprintf("Unexpected username: %s", username)))
						return
					}

					accessReviewRes := authv1.SubjectAccessReview{
						Spec: accessReviewReq.Spec,
						Status: authv1.SubjectAccessReviewStatus{
							Allowed: strings.HasPrefix(username, "clusteradmin"),
						},
					}
					if res, err := json.Marshal(accessReviewRes); err != nil {
						w.WriteHeader(http.StatusInternalServerError)
						w.Write([]byte(err.Error()))
					} else {
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(http.StatusOK)
						w.Write(res)
					}
				} else {
					w.WriteHeader(http.StatusNotFound)
				}
			}),
			expectedMetrics: `
			console_usage_users{role="cluster-admin"} 2
			console_usage_users{role="developer"} 3
			console_usage_users{role="kubeadmin"} 1
			console_usage_users{role="unknown"} 1
			`,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			testserver := httptest.NewServer(testcase.handler)
			defer testserver.Close()

			m := NewMetrics()
			err := m.updateUsersMetric(&http.Client{}, testserver.URL, "ignored-service-account-token")
			if testcase.expectedError != "" {
				assert.Equal(t, testcase.expectedError, err.Error())
			} else {
				assert.NoError(t, err)
			}

			assert.Equal(t,
				metrics.RemoveComments(testcase.expectedMetrics),
				metrics.RemoveComments(metrics.FormatMetrics(m.users)),
			)
		})
	}
}

func TestUsersMetricsRunningTwice(t *testing.T) {
	testcases := []struct {
		name               string
		handlerOne         http.Handler
		handlerTwo         http.Handler
		expectedMetricsOne string
		expectedMetricsTwo string
	}{
		{
			name: "can-get-namespaces-fails-first-time-and-works-then",
			handlerOne: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				if r.URL.Path == "/apis/rbac.authorization.k8s.io/v1/namespaces/openshift-console-user-settings/rolebindings" {
					w.Header().Set("Content-Type", "application/json")

					roleBindingList := rbac.RoleBindingList{
						Items: []rbac.RoleBinding{
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-unknown-user-role-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "unknown-user-role",
									},
								},
							},
						},
					}

					if res, err := json.Marshal(roleBindingList); err != nil {
						w.WriteHeader(http.StatusInternalServerError)
						w.Write([]byte(err.Error()))
					} else {
						w.WriteHeader(http.StatusOK)
						w.Write(res)
					}
				} else {
					w.WriteHeader(http.StatusNotFound)
				}
			}),
			handlerTwo: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				fmt.Printf("Mock testserver handles: %s\n", r.URL.Path)
				if r.URL.Path == "/apis/rbac.authorization.k8s.io/v1/namespaces/openshift-console-user-settings/rolebindings" {
					roleBindingList := rbac.RoleBindingList{
						Items: []rbac.RoleBinding{
							{
								ObjectMeta: v1.ObjectMeta{
									Name: "user-settings-clusteradmin-rolebinding",
								},
								Subjects: []rbac.Subject{
									{
										Kind: "User",
										Name: "clusteradmin",
									},
								},
							},
						},
					}

					if res, err := json.Marshal(roleBindingList); err != nil {
						w.WriteHeader(http.StatusInternalServerError)
						w.Write([]byte(err.Error()))
					} else {
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(http.StatusOK)
						w.Write(res)
					}
				} else if r.Method == http.MethodPost && r.URL.Path == "/apis/authorization.k8s.io/v1/subjectaccessreviews" {
					var accessReviewReq authv1.SubjectAccessReview
					err := json.NewDecoder(r.Body).Decode(&accessReviewReq)
					if err != nil {
						w.WriteHeader(http.StatusBadRequest)
						w.Write([]byte(fmt.Sprintf("Unexpected request: %s", err)))
						return
					}

					username := accessReviewReq.Spec.User
					if username != "clusteradmin" {
						w.WriteHeader(http.StatusInternalServerError)
						w.Write([]byte(fmt.Sprintf("Unexpected username: %s", username)))
						return
					}

					accessReviewRes := authv1.SubjectAccessReview{
						Spec: accessReviewReq.Spec,
						Status: authv1.SubjectAccessReviewStatus{
							Allowed: true,
						},
					}
					if res, err := json.Marshal(accessReviewRes); err != nil {
						w.WriteHeader(http.StatusInternalServerError)
						w.Write([]byte(err.Error()))
					} else {
						w.Header().Set("Content-Type", "application/json")
						w.WriteHeader(http.StatusOK)
						w.Write(res)
					}
				} else {
					w.WriteHeader(http.StatusNotFound)
				}
			}),
			expectedMetricsOne: `
			console_usage_users{role="unknown"} 1
			`,
			expectedMetricsTwo: `
			console_usage_users{role="cluster-admin"} 1
			console_usage_users{role="unknown"} 0
			`,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			m := NewMetrics()
			{
				testserver := httptest.NewServer(testcase.handlerOne)
				defer testserver.Close()
				assert.NoError(t, m.updateUsersMetric(&http.Client{}, testserver.URL, "ignored-service-account-token"))

				assert.Equal(t,
					metrics.RemoveComments(testcase.expectedMetricsOne),
					metrics.RemoveComments(metrics.FormatMetrics(m.users)),
				)
			}
			{
				testserver := httptest.NewServer(testcase.handlerTwo)
				defer testserver.Close()
				assert.NoError(t, m.updateUsersMetric(&http.Client{}, testserver.URL, "ignored-service-account-token"))

				assert.Equal(t,
					metrics.RemoveComments(testcase.expectedMetricsTwo),
					metrics.RemoveComments(metrics.FormatMetrics(m.users)),
				)
			}
		})
	}
}
