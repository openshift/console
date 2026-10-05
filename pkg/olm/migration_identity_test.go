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
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

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
