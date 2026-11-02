package olm

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	authv1 "k8s.io/api/authentication/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/rest"

	"github.com/openshift/console/pkg/auth"
)

// TestMigrationJobOwnerResolvesSessionToken covers the token-only OpenShift authentication context.
func TestMigrationJobOwnerResolvesSessionToken(t *testing.T) {
	tests := []struct {
		name      string
		identity  authv1.UserInfo
		apiStatus int
		status    int
		owner     string
	}{
		{name: "user UID", identity: authv1.UserInfo{Username: "alice", UID: "alice-uid"}, owner: "alice-uid"},
		{name: "kubeadmin without UID", identity: authv1.UserInfo{Username: "kube:admin"}, owner: "kube:admin"},
		{name: "empty identity", status: http.StatusUnauthorized},
		{name: "anonymous identity", identity: authv1.UserInfo{Username: "system:anonymous", UID: "anonymous"}, status: http.StatusUnauthorized},
		{name: "unauthenticated group", identity: authv1.UserInfo{Username: "alice", Groups: []string{"system:unauthenticated"}}, status: http.StatusUnauthorized},
		{name: "rejected token", apiStatus: http.StatusUnauthorized, status: http.StatusUnauthorized},
		{name: "forbidden review", apiStatus: http.StatusForbidden, status: http.StatusForbidden},
		{name: "temporary API outage", apiStatus: http.StatusServiceUnavailable, status: http.StatusServiceUnavailable},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			apiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, http.MethodPost, r.Method)
				assert.Equal(t, "/apis/authentication.k8s.io/v1/selfsubjectreviews", r.URL.Path)
				assert.Equal(t, "Bearer session-token", r.Header.Get("Authorization"))
				w.Header().Set("Content-Type", "application/json")
				if tt.apiStatus != 0 {
					w.WriteHeader(tt.apiStatus)
					_ = json.NewEncoder(w).Encode(metav1.Status{Status: "Failure", Code: int32(tt.apiStatus)})
					return
				}
				_ = json.NewEncoder(w).Encode(authv1.SelfSubjectReview{
					TypeMeta: metav1.TypeMeta{APIVersion: "authentication.k8s.io/v1", Kind: "SelfSubjectReview"},
					Status:   authv1.SelfSubjectReviewStatus{UserInfo: tt.identity},
				})
			}))
			defer apiServer.Close()
			handler := &OLMHandler{apiServerURL: apiServer.URL, client: apiServer.Client()}
			request := httptest.NewRequest(http.MethodGet, "/", nil)
			request = request.WithContext(context.WithValue(request.Context(), auth.UserContextKey, &auth.User{Token: "session-token"}))
			owner, err := handler.migrationJobOwner(request)
			assert.Equal(t, tt.owner, owner)
			if tt.status != 0 {
				require.Error(t, err)
				assert.Equal(t, tt.status, operatorMigrationErrorStatus(err))
				assert.NotContains(t, err.Error(), "session-token")
			} else {
				require.NoError(t, err)
			}
		})
	}
}

// TestMigrationHandlersAcrossOAuthSessions verifies job ownership survives renewed session tokens.
func TestMigrationHandlersAcrossOAuthSessions(t *testing.T) {
	apiServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/apis/authentication.k8s.io/v1/selfsubjectreviews", r.URL.Path)
		username := "alice"
		if r.Header.Get("Authorization") == "Bearer bob-token" {
			username = "bob"
		} else {
			assert.Contains(t, []string{"Bearer alice-token", "Bearer renewed-alice-token"}, r.Header.Get("Authorization"))
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(authv1.SelfSubjectReview{
			TypeMeta: metav1.TypeMeta{APIVersion: "authentication.k8s.io/v1", Kind: "SelfSubjectReview"},
			Status:   authv1.SelfSubjectReviewStatus{UserInfo: authv1.UserInfo{Username: username, UID: username + "-uid"}},
		})
	}))
	defer apiServer.Close()
	kubeClient := newMigrationTestClient(t)
	handler := newMigrationTestHandler(kubeClient)
	handler.apiServerURL, handler.client = apiServer.URL, apiServer.Client()
	requestFor := func(method, token, id string) *http.Request {
		request := httptest.NewRequest(method, "/", strings.NewReader(`{"allEligible":true}`))
		request.SetPathValue("jobID", id)
		return request.WithContext(context.WithValue(request.Context(), auth.UserContextKey, &auth.User{Token: token}))
	}
	created := httptest.NewRecorder()
	handler.migrationBulkHandler(created, requestFor(http.MethodPost, "alice-token", ""))
	require.Equal(t, http.StatusAccepted, created.Code, created.Body.String())
	var result map[string]string
	require.NoError(t, json.Unmarshal(created.Body.Bytes(), &result))
	id := result["jobID"]
	require.NotEmpty(t, id)

	record, err := readDurableMigrationJob(context.Background(), kubeClient, id, "alice-uid")
	require.NoError(t, err)
	require.NotNil(t, record)
	encoded, err := json.Marshal(record)
	require.NoError(t, err)
	assert.NotContains(t, string(encoded), "alice-token")

	discovered := httptest.NewRecorder()
	handler.migrationJobsHandler(discovered, requestFor(http.MethodGet, "renewed-alice-token", ""))
	require.Equal(t, http.StatusOK, discovered.Code, discovered.Body.String())
	var jobs []operatorMigrationJobSnapshot
	require.NoError(t, json.Unmarshal(discovered.Body.Bytes(), &jobs))
	require.Len(t, jobs, 1)
	assert.Equal(t, id, jobs[0].ID)

	read := httptest.NewRecorder()
	handler.migrationJobHandler(read, requestFor(http.MethodGet, "renewed-alice-token", id))
	assert.Equal(t, http.StatusOK, read.Code, read.Body.String())

	otherUser := httptest.NewRecorder()
	handler.migrationJobHandler(otherUser, requestFor(http.MethodGet, "bob-token", id))
	assert.Equal(t, http.StatusNotFound, otherUser.Code)
	otherUserCancel := httptest.NewRecorder()
	handler.migrationJobCancelHandler(otherUserCancel, requestFor(http.MethodPost, "bob-token", id))
	assert.Equal(t, http.StatusConflict, otherUserCancel.Code)

	cancelled := httptest.NewRecorder()
	handler.migrationJobCancelHandler(cancelled, requestFor(http.MethodPost, "renewed-alice-token", id))
	assert.Equal(t, http.StatusAccepted, cancelled.Code, cancelled.Body.String())
}

// TestMigrationBackendSubjectUsesConfiguredCredentials covers custom deployments and local user credentials without assuming the Console service account.
func TestMigrationBackendSubjectUsesConfiguredCredentials(t *testing.T) {
	for _, tt := range []struct {
		name     string
		identity authv1.UserInfo
		want     rbacv1.Subject
		invalid  bool
	}{
		{name: "custom deployment", identity: authv1.UserInfo{Username: "system:serviceaccount:custom-project:custom-console"}, want: rbacv1.Subject{Kind: rbacv1.ServiceAccountKind, Namespace: "custom-project", Name: "custom-console"}},
		{name: "local user", identity: authv1.UserInfo{Username: "developer"}, want: rbacv1.Subject{Kind: rbacv1.UserKind, APIGroup: rbacv1.GroupName, Name: "developer"}},
		{name: "missing identity", invalid: true},
		{name: "anonymous", identity: authv1.UserInfo{Username: "system:anonymous"}, invalid: true},
		{name: "unauthenticated group", identity: authv1.UserInfo{Username: "developer", Groups: []string{"system:unauthenticated"}}, invalid: true},
		{name: "malformed service account", identity: authv1.UserInfo{Username: "system:serviceaccount::console"}, invalid: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			requests := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				requests++
				assert.Equal(t, "/apis/authentication.k8s.io/v1/selfsubjectreviews", r.URL.Path)
				assert.Equal(t, "Bearer configured-backend-token", r.Header.Get("Authorization"))
				w.Header().Set("Content-Type", "application/json")
				_ = json.NewEncoder(w).Encode(authv1.SelfSubjectReview{TypeMeta: metav1.TypeMeta{APIVersion: "authentication.k8s.io/v1", Kind: "SelfSubjectReview"}, Status: authv1.SelfSubjectReviewStatus{UserInfo: tt.identity}})
			}))
			defer server.Close()
			c := &migrationCoordinator{config: &rest.Config{Host: server.URL, BearerToken: "configured-backend-token"}}
			subject, err := c.backendSubject(context.Background())
			if tt.invalid {
				require.Error(t, err)
				assert.Empty(t, c.subject.Name)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want, subject)
			cached, err := c.backendSubject(context.Background())
			require.NoError(t, err)
			assert.Equal(t, subject, cached)
			assert.Equal(t, 1, requests)
		})
	}
}

// TestMigrationImpersonationUsesEffectiveIdentity checks authorization, ownership, and catalog requests with a real HTTP transport.
func TestMigrationImpersonationUsesEffectiveIdentity(t *testing.T) {
	for _, tt := range []struct {
		name, username, groups string
		forbidden              bool
	}{
		{name: "read-only user", username: "reader", groups: " readers, team-a "},
		{name: "service account", username: "system:serviceaccount:team-a:reader", groups: "system:serviceaccounts,system:serviceaccounts:team-a"},
		{name: "impersonation denied", username: "denied", forbidden: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			writes := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, "Bearer administrator-token", r.Header.Get("Authorization"))
				assert.Equal(t, tt.username, r.Header.Get("Impersonate-User"))
				assert.Equal(t, "effective-uid", r.Header.Get("Impersonate-Uid"))
				groups := []string{"legacy-group"}
				for _, group := range strings.Split(tt.groups, ",") {
					if group = strings.TrimSpace(group); group != "" {
						groups = append(groups, group)
					}
				}
				groups = append(groups, "system:authenticated")
				assert.ElementsMatch(t, groups, r.Header.Values("Impersonate-Group"))
				assert.Empty(t, r.Header.Get("X-Console-Impersonate-Groups"))
				w.Header().Set("Content-Type", "application/json")
				switch r.URL.Path {
				case "/apis/authentication.k8s.io/v1/selfsubjectreviews":
					if !tt.forbidden {
						_ = json.NewEncoder(w).Encode(authv1.SelfSubjectReview{TypeMeta: metav1.TypeMeta{APIVersion: "authentication.k8s.io/v1", Kind: "SelfSubjectReview"}, Status: authv1.SelfSubjectReviewStatus{UserInfo: authv1.UserInfo{Username: tt.username, UID: "effective-uid"}}})
						return
					}
				case "/api":
					_ = json.NewEncoder(w).Encode(metav1.APIVersions{Versions: []string{"v1"}})
					return
				case "/apis":
					_ = json.NewEncoder(w).Encode(metav1.APIGroupList{})
					return
				case "/api/v1":
					_ = json.NewEncoder(w).Encode(metav1.APIResourceList{GroupVersion: "v1", APIResources: []metav1.APIResource{{Name: "namespaces", Kind: "Namespace"}}})
					return
				case "/api/v1/namespaces":
					writes++
				}
				w.WriteHeader(http.StatusForbidden)
				_ = json.NewEncoder(w).Encode(metav1.Status{Status: "Failure", Reason: metav1.StatusReasonForbidden, Code: http.StatusForbidden})
			}))
			defer server.Close()
			handler := &OLMHandler{apiServerURL: server.URL, client: server.Client()}
			request := httptest.NewRequest(http.MethodPost, "/", nil)
			request = request.WithContext(context.WithValue(request.Context(), auth.UserContextKey, &auth.User{ID: "administrator-uid", Username: "administrator", Token: "administrator-token"}))
			request.Header.Set("Impersonate-User", tt.username)
			request.Header.Set("Impersonate-Uid", "effective-uid")
			request.Header.Set("Impersonate-Group", "legacy-group")
			request.Header.Set("X-Console-Impersonate-Groups", tt.groups)
			owner, err := handler.migrationJobOwner(request)
			if tt.forbidden {
				require.True(t, apierrors.IsForbidden(err), "%v", err)
				assert.Empty(t, owner)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, "effective-uid", owner)
			migrator, err := handler.newOperatorMigrator(request)
			require.NoError(t, err)
			err = migrator.Client.Create(request.Context(), &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "blocked"}})
			require.True(t, apierrors.IsForbidden(err), "%v", err)
			assert.Equal(t, 1, writes)
			catalogClient, err := rest.HTTPClientFor(migrator.RESTConfig)
			require.NoError(t, err)
			response, err := catalogClient.Get(server.URL + "/api/v1/namespaces/catalog/pods/leader/portforward")
			require.NoError(t, err)
			defer response.Body.Close()
			assert.Equal(t, http.StatusForbidden, response.StatusCode)
		})
	}
}
