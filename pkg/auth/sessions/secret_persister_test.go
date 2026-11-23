package sessions

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/gorilla/securecookie"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
)

const testSessionNamespace = "console-sessions"

type persistenceFixture struct {
	t             *testing.T
	clientset     *fake.Clientset
	authnKey      []byte
	encryptionKey []byte
	verifier      IDTokenVerifier
	idToken       string
}

func newPersistenceFixture(t *testing.T) *persistenceFixture {
	claims := `{"sub":"user-id-0","name":"Test User","email":"test@example.com","exp":` +
		strconv.FormatInt(time.Now().Add(time.Hour).Unix(), 10) + `}`
	return &persistenceFixture{
		t:             t,
		clientset:     fake.NewClientset(),
		authnKey:      []byte(randomString(64)),
		encryptionKey: []byte(randomString(32)),
		verifier:      newTestVerifier(claims),
		idToken:       createTestIDToken(claims),
	}
}

// newStore stands for one bridge process: a fresh memory cache over the shared Secrets.
func (f *persistenceFixture) newStore() *CombinedSessionStore {
	return NewPersistentSessionStore(f.authnKey, f.encryptionKey, true, "/", f.newPersister())
}

func (f *persistenceFixture) newPersister() *SecretPersister {
	return NewSecretPersister(f.clientset.CoreV1().Secrets(testSessionNamespace))
}

func (f *persistenceFixture) token(refreshToken string) *oauth2.Token {
	return addIDToken(&oauth2.Token{RefreshToken: refreshToken}, f.idToken)
}

func (f *persistenceFixture) login(cs *CombinedSessionStore, refreshToken string) (*LoginState, []*http.Cookie) {
	w := httptest.NewRecorder()
	ls, err := cs.AddSession(w, httptest.NewRequest(http.MethodGet, "/", nil), f.verifier, f.token(refreshToken))
	require.NoError(f.t, err)
	return ls, w.Result().Cookies()
}

func (f *persistenceFixture) secrets() map[string]*persistedSession {
	list, err := f.clientset.CoreV1().Secrets(testSessionNamespace).List(context.Background(), metav1.ListOptions{})
	require.NoError(f.t, err)
	got := map[string]*persistedSession{}
	for i := range list.Items {
		s, err := decodeSessionSecret(&list.Items[i])
		require.NoError(f.t, err)
		got[list.Items[i].Name] = s
	}
	return got
}

// countGets ignores the List calls of the background prune loop.
func (f *persistenceFixture) countGets() int {
	gets := 0
	for _, a := range f.clientset.Actions() {
		if a.GetVerb() == "get" {
			gets++
		}
	}
	return gets
}

func requestWithCookies(cookies []*http.Cookie) *http.Request {
	req := httptest.NewRequest(http.MethodGet, "/api/kubernetes", nil)
	for _, c := range cookies {
		if c.MaxAge >= 0 {
			req.AddCookie(&http.Cookie{Name: c.Name, Value: c.Value})
		}
	}
	return req
}

// mergeCookies returns the browser's cookie jar after it applies updates.
func mergeCookies(jar, updates []*http.Cookie) []*http.Cookie {
	byName := map[string]*http.Cookie{}
	for _, c := range append(append([]*http.Cookie{}, jar...), updates...) {
		byName[c.Name] = c
	}
	merged := []*http.Cookie{}
	for _, c := range byName {
		merged = append(merged, c)
	}
	return merged
}

func cookieRefreshTokenID(t *testing.T, f *persistenceFixture, cookies []*http.Cookie) string {
	for _, c := range cookies {
		if c.Name == openshiftRefreshTokenCookieName {
			values := map[interface{}]interface{}{}
			codecs := securecookie.CodecsFromPairs(f.authnKey, f.encryptionKey)
			require.NoError(t, securecookie.DecodeMulti(c.Name, c.Value, &values, codecs...))
			return values["refresh-token-id"].(string)
		}
	}
	t.Fatal("refresh token cookie not found")
	return ""
}

func TestPersistentSessionStore_SessionSurvivesRestart(t *testing.T) {
	f := newPersistenceFixture(t)
	loggedIn, cookies := f.login(f.newStore(), "refresh-1")

	restarted := f.newStore()
	got, err := restarted.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.NotNil(t, got)
	require.Equal(t, "user-id-0", got.UserID())
	require.Equal(t, "Test User", got.Username())
	require.Equal(t, loggedIn.AccessToken(), got.AccessToken())
	require.Equal(t, "refresh-1", got.RefreshToken())
	require.Equal(t, loggedIn.SessionToken(), got.SessionToken())
	require.True(t, loggedIn.exp.Equal(got.exp))
	require.False(t, got.IsExpired())

	// The loaded session is cached, so the next request does not read the Secret.
	gets := f.countGets()
	again, err := restarted.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.Same(t, got, again)
	require.Equal(t, gets, f.countGets())
}

func TestPersistentSessionStore_RefreshTokenSurvivesRestart(t *testing.T) {
	f := newPersistenceFixture(t)
	_, cookies := f.login(f.newStore(), "refresh-1")

	require.Equal(t, "refresh-1", f.newStore().GetCookieRefreshToken(requestWithCookies(cookies)))
}

func TestPersistentSessionStore_UpdateTokensPersistsRotation(t *testing.T) {
	f := newPersistenceFixture(t)
	loggedIn, oldCookies := f.login(f.newStore(), "refresh-1")
	id := cookieRefreshTokenID(t, f, oldCookies)

	w := httptest.NewRecorder()
	updated, err := f.newStore().UpdateTokens(w, requestWithCookies(oldCookies), f.verifier, f.token("refresh-2"))
	require.NoError(t, err)
	require.Equal(t, loggedIn.SessionToken(), updated.SessionToken())
	newCookies := mergeCookies(oldCookies, w.Result().Cookies())
	require.Equal(t, id, cookieRefreshTokenID(t, f, newCookies))

	persisted := f.secrets()[sessionSecretName(loggedIn.SessionToken())]
	require.NotNil(t, persisted)
	require.Equal(t, "refresh-2", persisted.RefreshToken)
	require.Equal(t, id, persisted.RefreshTokenID)

	require.Equal(t, "refresh-2", f.newStore().GetCookieRefreshToken(requestWithCookies(newCookies)))
}

func TestPersistentSessionStore_ShortCircuitCookieSurvivesRestart(t *testing.T) {
	f := newPersistenceFixture(t)
	cs := f.newStore()
	ls, cookies := f.login(cs, "refresh-1")

	// Another request refreshed the session; this one only repoints its cookie,
	// which already holds the session's refresh token ID.
	w := httptest.NewRecorder()
	require.NoError(t, cs.UpdateCookieRefreshToken(w, requestWithCookies(cookies), ls.RefreshToken()))
	require.Empty(t, w.Result().Cookies())
	require.Equal(t, "refresh-1", f.newStore().GetCookieRefreshToken(requestWithCookies(cookies)))
}

func TestPersistentSessionStore_DeleteSessionDeletesSecret(t *testing.T) {
	f := newPersistenceFixture(t)
	cs := f.newStore()
	_, cookies := f.login(cs, "refresh-1")
	require.Len(t, f.secrets(), 1)

	require.NoError(t, cs.DeleteSession(httptest.NewRecorder(), requestWithCookies(cookies)))
	require.Empty(t, f.secrets())

	got, err := f.newStore().GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.Nil(t, got)
}

func TestPersistentSessionStore_LogoutReachesOtherReplicas(t *testing.T) {
	f := newPersistenceFixture(t)
	replicaA, replicaB := f.newStore(), f.newStore()
	_, cookies := f.login(replicaA, "refresh-1")

	// Replica B serves the user and caches the session.
	cached, err := replicaB.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.NotNil(t, cached)

	require.NoError(t, replicaA.DeleteSession(httptest.NewRecorder(), requestWithCookies(cookies)))
	require.Empty(t, f.secrets())

	// A refresh on B writes the rotated tokens with Update, which does not
	// bring the deleted Secret back, and B forgets the session.
	_, err = replicaB.UpdateTokens(httptest.NewRecorder(), requestWithCookies(cookies), f.verifier, f.token("refresh-2"))
	require.ErrorIs(t, err, errSessionDeleted)
	require.Empty(t, f.secrets())
	got, err := replicaB.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.Nil(t, got)
}

func TestPersistentSessionStore_RefreshChecksForLogout(t *testing.T) {
	f := newPersistenceFixture(t)
	replicaA, replicaB := f.newStore(), f.newStore()
	_, cookies := f.login(replicaA, "refresh-1")
	require.Equal(t, "refresh-1", replicaB.GetCookieRefreshToken(requestWithCookies(cookies)))

	require.NoError(t, replicaA.DeleteSession(httptest.NewRecorder(), requestWithCookies(cookies)))

	// B still caches the session, but must not hand out its refresh token.
	require.Equal(t, "", replicaB.GetCookieRefreshToken(requestWithCookies(cookies)))
	got, err := replicaB.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.Nil(t, got)
}

// hangingUpdatePersister writes its first Update, then hangs until release is closed.
// (A fake clientset reactor cannot block: the fake holds its lock meanwhile.)
type hangingUpdatePersister struct {
	*SecretPersister
	entered, release chan struct{}
}

func (p *hangingUpdatePersister) Update(ctx context.Context, s *persistedSession) error {
	err := p.SecretPersister.Update(ctx, s)
	close(p.entered)
	<-p.release
	return err
}

func TestPersistentSessionStore_SlowWriteDoesNotBlockOtherRequests(t *testing.T) {
	f := newPersistenceFixture(t)
	p := &hangingUpdatePersister{SecretPersister: f.newPersister(), entered: make(chan struct{}), release: make(chan struct{})}
	cs := NewPersistentSessionStore(f.authnKey, f.encryptionKey, true, "/", p)
	_, slowCookies := f.login(cs, "refresh-1")
	_, otherCookies := f.login(cs, "refresh-other")

	done := make(chan error)
	go func() {
		_, err := cs.UpdateTokens(httptest.NewRecorder(), requestWithCookies(slowCookies), f.verifier, f.token("refresh-2"))
		done <- err
	}()
	<-p.entered

	// While that Secret update hangs, other users keep working.
	got, err := cs.GetSession(httptest.NewRecorder(), requestWithCookies(otherCookies))
	require.NoError(t, err)
	require.NotNil(t, got)
	f.login(cs, "refresh-3")

	close(p.release)
	require.NoError(t, <-done)
}

func TestPersistentSessionStore_LogoutDuringTokenWriteWins(t *testing.T) {
	f := newPersistenceFixture(t)
	p := &hangingUpdatePersister{SecretPersister: f.newPersister(), entered: make(chan struct{}), release: make(chan struct{})}
	cs := NewPersistentSessionStore(f.authnKey, f.encryptionKey, true, "/", p)
	_, cookies := f.login(cs, "refresh-1")

	w := httptest.NewRecorder()
	done := make(chan error)
	go func() {
		_, err := cs.UpdateTokens(w, requestWithCookies(cookies), f.verifier, f.token("refresh-2"))
		done <- err
	}()
	<-p.entered

	// The user logs out on this pod after the refresh wrote the Secret, but
	// before the refresh updated memory. The logout waits for the refresh.
	loggedOut := make(chan error)
	go func() { loggedOut <- cs.DeleteSession(httptest.NewRecorder(), requestWithCookies(cookies)) }()
	close(p.release)

	require.NoError(t, <-done)
	require.NoError(t, <-loggedOut)
	require.Empty(t, f.secrets())
	got, err := cs.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.Nil(t, got)
}

func TestSecretPersister_Prune(t *testing.T) {
	f := newPersistenceFixture(t)
	p := f.newPersister()
	ctx := context.Background()
	now := time.Now()
	maxAge := 30 * 24 * time.Hour

	save := func(sessionToken string, exp time.Time, refreshToken string, updatedAt time.Time) {
		p.now = func() time.Time { return updatedAt }
		require.NoError(t, p.Create(ctx, &persistedSession{
			SessionToken:   sessionToken,
			Exp:            exp,
			RefreshToken:   refreshToken,
			RefreshTokenID: "id-" + sessionToken,
		}))
	}
	save("live", now.Add(time.Hour), "refresh", now)
	save("expired-refreshable", now.Add(-time.Hour), "refresh", now)
	save("expired-unrefreshable", now.Add(-time.Hour), "", now)
	save("stale", now.Add(time.Hour), "refresh", now.Add(-maxAge-time.Hour))

	p.now = func() time.Time { return now }
	require.NoError(t, p.Prune(ctx, maxAge))

	remaining := f.secrets()
	require.Len(t, remaining, 2)
	require.Contains(t, remaining, sessionSecretName("live"))
	require.Contains(t, remaining, sessionSecretName("expired-refreshable"))

	// A second replica pruning the same Secrets is harmless.
	require.NoError(t, p.Prune(ctx, maxAge))
	require.Len(t, f.secrets(), 2)
}

func TestSessionCookieName_StableOnlyWithPersistence(t *testing.T) {
	t.Setenv("POD_NAME", "console-abc")
	legacyCookie := &http.Cookie{Name: OpenshiftAccessTokenCookieName + "-console-old", Value: "x"}

	tests := []struct {
		name           string
		persist        bool
		wantCookieName string
	}{
		{name: "in memory", persist: false, wantCookieName: OpenshiftAccessTokenCookieName + "-console-abc"},
		{name: "persisted", persist: true, wantCookieName: OpenshiftAccessTokenCookieName},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := newPersistenceFixture(t)
			cs := NewSessionStore(f.authnKey, f.encryptionKey, true, "/")
			if tt.persist {
				cs = f.newStore()
			}

			req := httptest.NewRequest(http.MethodGet, "/", nil)
			req.AddCookie(legacyCookie)
			w := httptest.NewRecorder()
			_, err := cs.AddSession(w, req, f.verifier, f.token("refresh-1"))
			require.NoError(t, err)

			cookies := map[string]*http.Cookie{}
			for _, c := range w.Result().Cookies() {
				cookies[c.Name] = c
			}
			require.Contains(t, cookies, tt.wantCookieName)
			require.NotEqual(t, -1, cookies[tt.wantCookieName].MaxAge)
			require.Equal(t, -1, cookies[legacyCookie.Name].MaxAge, "legacy per-pod cookie should be expired")
			if !tt.persist {
				require.Empty(t, f.secrets())
			}
		})
	}
}

var errInjected = errors.New("injected persister failure")

// faultyPersister fails the calls whose flag is set.
type faultyPersister struct {
	*SecretPersister
	failCreate, failUpdate, failDelete bool
}

func (p *faultyPersister) Create(ctx context.Context, s *persistedSession) error {
	if p.failCreate {
		return errInjected
	}
	return p.SecretPersister.Create(ctx, s)
}

func (p *faultyPersister) Update(ctx context.Context, s *persistedSession) error {
	if p.failUpdate {
		return errInjected
	}
	return p.SecretPersister.Update(ctx, s)
}

func (p *faultyPersister) Delete(ctx context.Context, sessionToken string) error {
	if p.failDelete {
		return errInjected
	}
	return p.SecretPersister.Delete(ctx, sessionToken)
}

func (f *persistenceFixture) newFaultyStore() (*CombinedSessionStore, *faultyPersister) {
	p := &faultyPersister{SecretPersister: f.newPersister()}
	return NewPersistentSessionStore(f.authnKey, f.encryptionKey, true, "/", p), p
}

func TestPersistentSessionStore_LoginFailsIfNotPersisted(t *testing.T) {
	f := newPersistenceFixture(t)
	cs, p := f.newFaultyStore()
	p.failCreate = true

	// A session only in memory would be dropped at its first refresh, which
	// finds no Secret. So the login fails now, and the user can retry.
	w := httptest.NewRecorder()
	_, err := cs.AddSession(w, httptest.NewRequest(http.MethodGet, "/", nil), f.verifier, f.token("refresh-1"))
	require.ErrorIs(t, err, errInjected)
	require.Empty(t, w.Result().Cookies())
	require.Empty(t, cs.serverStore.byToken)
	require.Empty(t, cs.serverStore.byRefreshTokenID)
}

func TestPersistentSessionStore_TokenUpdateIsNotCommittedIfNotPersisted(t *testing.T) {
	f := newPersistenceFixture(t)
	cs, p := f.newFaultyStore()
	ls, cookies := f.login(cs, "refresh-1")
	p.failUpdate = true

	w := httptest.NewRecorder()
	_, err := cs.UpdateTokens(w, requestWithCookies(cookies), f.verifier, f.token("refresh-2"))
	require.ErrorIs(t, err, errInjected)
	require.Empty(t, w.Result().Cookies())

	// Memory still matches the Secret, so re-reading it rolls nothing back.
	require.Equal(t, "refresh-1", f.secrets()[sessionSecretName(ls.SessionToken())].RefreshToken)
	require.Equal(t, "refresh-1", cs.GetCookieRefreshToken(requestWithCookies(cookies)))
	got, err := cs.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.Equal(t, "refresh-1", got.RefreshToken())
}

func TestPersistentSessionStore_ReloadDoesNotModifyHandedOutSession(t *testing.T) {
	f := newPersistenceFixture(t)
	replicaA, replicaB := f.newStore(), f.newStore()
	_, cookies := f.login(replicaA, "refresh-1")
	onB, err := replicaB.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)

	w := httptest.NewRecorder()
	_, err = replicaA.UpdateTokens(w, requestWithCookies(cookies), f.verifier, f.token("refresh-2"))
	require.NoError(t, err)
	newCookies := mergeCookies(cookies, w.Result().Cookies())

	// Requests read a LoginState without a lock, like Authenticate does, while
	// B re-reads the rotated session.
	done := make(chan string)
	go func() { done <- onB.AccessToken() + onB.RefreshToken() }()
	require.Equal(t, "refresh-2", replicaB.GetCookieRefreshToken(requestWithCookies(newCookies)))
	<-done

	require.Equal(t, "refresh-1", onB.RefreshToken())
	reloaded, err := replicaB.GetSession(httptest.NewRecorder(), requestWithCookies(newCookies))
	require.NoError(t, err)
	require.Equal(t, "refresh-2", reloaded.RefreshToken())
}

func TestPersistentSessionStore_RefreshAfterLogoutDoesNotCreateSession(t *testing.T) {
	f := newPersistenceFixture(t)
	replicaA, replicaB := f.newStore(), f.newStore()
	_, cookies := f.login(replicaA, "refresh-1")
	require.Equal(t, "refresh-1", replicaB.GetCookieRefreshToken(requestWithCookies(cookies)))

	// The user logs out on A while B refreshes the token with the identity
	// provider. Another request on B meanwhile finds the Secret gone.
	require.NoError(t, replicaA.DeleteSession(httptest.NewRecorder(), requestWithCookies(cookies)))
	require.Equal(t, "", replicaB.GetCookieRefreshToken(requestWithCookies(cookies)))

	w := httptest.NewRecorder()
	_, err := replicaB.UpdateTokens(w, requestWithCookies(cookies), f.verifier, f.token("refresh-2"))
	require.Error(t, err)
	require.Empty(t, w.Result().Cookies())
	require.Empty(t, f.secrets())
}

func TestPersistentSessionStore_RefreshCookieAloneCannotOutliveLogout(t *testing.T) {
	f := newPersistenceFixture(t)
	replicaA, replicaB := f.newStore(), f.newStore()
	_, cookies := f.login(replicaA, "refresh-1")
	got, err := replicaB.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.NotNil(t, got)
	require.NoError(t, replicaA.DeleteSession(httptest.NewRecorder(), requestWithCookies(cookies)))

	// A copy of only the refresh token cookie, replayed on the replica that
	// cached the session, neither refreshes nor starts a new session.
	var refreshOnly []*http.Cookie
	for _, c := range cookies {
		if c.Name == openshiftRefreshTokenCookieName {
			refreshOnly = append(refreshOnly, c)
		}
	}
	require.Len(t, refreshOnly, 1)
	require.Equal(t, "", replicaB.GetCookieRefreshToken(requestWithCookies(refreshOnly)))
	w := httptest.NewRecorder()
	_, err = replicaB.UpdateTokens(w, requestWithCookies(refreshOnly), f.verifier, f.token("refresh-2"))
	require.ErrorIs(t, err, errSessionDeleted)
	require.Empty(t, w.Result().Cookies())
	require.Empty(t, f.secrets())
}

func TestPersistentSessionStore_LogoutClearsCookiesIfSecretDeleteFails(t *testing.T) {
	f := newPersistenceFixture(t)
	cs, p := f.newFaultyStore()
	_, cookies := f.login(cs, "refresh-1")
	p.failDelete = true

	w := httptest.NewRecorder()
	require.NoError(t, cs.DeleteSession(w, requestWithCookies(cookies)))
	for _, c := range w.Result().Cookies() {
		require.Equal(t, -1, c.MaxAge, c.Name)
	}
	require.Len(t, w.Result().Cookies(), 2)
}

// pausingGetPersister holds its first Get response, already read, until release is closed.
type pausingGetPersister struct {
	*SecretPersister
	read, release chan struct{}
}

func (p *pausingGetPersister) Get(ctx context.Context, sessionToken string) (*persistedSession, error) {
	s, err := p.SecretPersister.Get(ctx, sessionToken)
	select {
	case <-p.read:
	default:
		close(p.read)
		<-p.release
	}
	return s, err
}

func TestPersistentSessionStore_StaleReloadDoesNotRollBackRefresh(t *testing.T) {
	f := newPersistenceFixture(t)
	p := &pausingGetPersister{SecretPersister: f.newPersister(), read: make(chan struct{}), release: make(chan struct{})}
	cs := NewPersistentSessionStore(f.authnKey, f.encryptionKey, true, "/", p)
	_, cookies := f.login(cs, "refresh-1")

	// Two requests of one browser at rotation time: T2 reads the Secret, and
	// T1 rotates the tokens meanwhile. T1 waits for T2's read, so the read
	// cannot be older than memory when T2 caches it.
	t2 := make(chan string)
	go func() { t2 <- cs.GetCookieRefreshToken(requestWithCookies(cookies)) }()
	<-p.read
	t1 := make(chan error)
	go func() {
		_, err := cs.UpdateTokens(httptest.NewRecorder(), requestWithCookies(cookies), f.verifier, f.token("refresh-2"))
		t1 <- err
	}()
	close(p.release)

	require.Equal(t, "refresh-1", <-t2)
	require.NoError(t, <-t1)
	got, err := cs.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.Equal(t, "refresh-2", got.RefreshToken())
}

func TestPersistentSessionStore_LogoutDuringColdLoadWins(t *testing.T) {
	f := newPersistenceFixture(t)
	_, cookies := f.login(f.newStore(), "refresh-1")
	p := &pausingGetPersister{SecretPersister: f.newPersister(), read: make(chan struct{}), release: make(chan struct{})}
	cs := NewPersistentSessionStore(f.authnKey, f.encryptionKey, true, "/", p)

	// A pod that has not cached the session reads its Secret, and the user
	// logs out on that pod before the read returns.
	loaded := make(chan error)
	go func() {
		_, err := cs.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
		loaded <- err
	}()
	<-p.read
	loggedOut := make(chan error, 1)
	go func() { loggedOut <- cs.DeleteSession(httptest.NewRecorder(), requestWithCookies(cookies)) }()
	// Give the logout time to finish if it does not wait for the read.
	select {
	case err := <-loggedOut:
		loggedOut <- err
	case <-time.After(200 * time.Millisecond):
	}
	close(p.release)
	require.NoError(t, <-loaded)
	require.NoError(t, <-loggedOut)

	require.Empty(t, f.secrets())
	got, err := cs.GetSession(httptest.NewRecorder(), requestWithCookies(cookies))
	require.NoError(t, err)
	require.Nil(t, got)
}

func TestPersistentSessionStore_ConcurrentRefreshesOnReplicasAgreeOnCookie(t *testing.T) {
	f := newPersistenceFixture(t)
	replicaA, replicaB := f.newStore(), f.newStore()
	_, cookies := f.login(replicaA, "refresh-1")

	// Both replicas refresh refresh-1 (the identity provider allows reuse for
	// a moment); B writes last, but the browser applies A's cookie last.
	wA := httptest.NewRecorder()
	_, err := replicaA.UpdateTokens(wA, requestWithCookies(cookies), f.verifier, f.token("refresh-2a"))
	require.NoError(t, err)
	wB := httptest.NewRecorder()
	_, err = replicaB.UpdateTokens(wB, requestWithCookies(cookies), f.verifier, f.token("refresh-2b"))
	require.NoError(t, err)
	jar := mergeCookies(mergeCookies(cookies, wB.Result().Cookies()), wA.Result().Cookies())

	// After a rollout, the cookie still finds the refresh token in the Secret.
	require.Equal(t, "refresh-2b", f.newStore().GetCookieRefreshToken(requestWithCookies(jar)))
}
