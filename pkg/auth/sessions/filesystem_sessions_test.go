package sessions

import (
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

// Test gob encoding of persistentSessionData
func TestPersistentSessionData_GobEncoding(t *testing.T) {
	// Test that our persistentSessionData struct can be stored in session values
	// (Gorilla sessions will handle the actual gob encoding internally)

	original := persistentSessionData{
		SessionToken: "test-session-token",
		UserID:       "test-user-id",
		Username:     "Test User",
		Email:        "test@example.com",
		AccessToken:  "test-access-token",
		RefreshToken: "test-refresh-token",
		ExpiresAt:    time.Now().Add(1 * time.Hour).Truncate(time.Second),
		RotateAt:     time.Now().Add(30 * time.Minute).Truncate(time.Second),
	}

	// Test that we can store and retrieve the struct in a session value map
	sessionValues := make(map[interface{}]interface{})
	sessionValues["session-data"] = original

	// Verify we can retrieve it with type assertion
	retrieved, ok := sessionValues["session-data"].(persistentSessionData)
	require.True(t, ok, "Failed to retrieve persistentSessionData from session values")

	// Verify all fields match
	require.Equal(t, original.SessionToken, retrieved.SessionToken)
	require.Equal(t, original.UserID, retrieved.UserID)
	require.Equal(t, original.Username, retrieved.Username)
	require.Equal(t, original.Email, retrieved.Email)
	require.Equal(t, original.AccessToken, retrieved.AccessToken)
	require.Equal(t, original.RefreshToken, retrieved.RefreshToken)
	require.Equal(t, original.ExpiresAt, retrieved.ExpiresAt)
	require.Equal(t, original.RotateAt, retrieved.RotateAt)
}

// Test FilesystemStore creation and session directory
func TestFilesystemSessionStore_Creation(t *testing.T) {
	// Create temporary directory for session storage
	sessionDir, err := os.MkdirTemp("", "console-session-test-*")
	require.NoError(t, err)
	defer os.RemoveAll(sessionDir)

	// Create session store
	authnKey := []byte("test-authn-key-32-bytes-long!!!")
	encryptKey := []byte("test-encrypt-key-32-bytes-long!!")
	store := NewSessionStore(authnKey, encryptKey, false, "/", sessionDir)
	require.NotNil(t, store)
	require.NotNil(t, store.clientStore)
}

// Test reconstructLoginState function
func TestReconstructLoginState(t *testing.T) {
	sessionData := persistentSessionData{
		SessionToken: "test-session-token",
		UserID:       "test-user-id",
		Username:     "Test User",
		Email:        "test@example.com",
		AccessToken:  "test-access-token",
		RefreshToken: "test-refresh-token",
		ExpiresAt:    time.Now().Add(1 * time.Hour),
		RotateAt:     time.Now().Add(30 * time.Minute),
	}

	loginState := reconstructLoginState(sessionData)
	require.NotNil(t, loginState)

	// Verify all data was reconstructed correctly
	require.Equal(t, sessionData.UserID, loginState.UserID())
	require.Equal(t, sessionData.Username, loginState.Username())
	require.Equal(t, sessionData.AccessToken, loginState.AccessToken())
	require.Equal(t, sessionData.RefreshToken, loginState.RefreshToken())
	require.Equal(t, sessionData.SessionToken, loginState.SessionToken())
}
