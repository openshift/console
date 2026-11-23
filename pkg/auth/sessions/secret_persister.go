package sessions

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/labels"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/klog/v2"
)

const (
	sessionSecretPrefix = "console-session-"
	sessionSecretKey    = "session"
	// sessionLabel marks every Secret that holds a console session.
	sessionLabel = "console.openshift.io/session"
)

var errSessionDeleted = errors.New("persisted session was deleted")

// SessionPersister stores login states outside the process, so that sessions
// survive restarts and are shared between replicas.
type SessionPersister interface {
	Create(ctx context.Context, s *persistedSession) error
	// Update returns errSessionDeleted when the session is gone: it was logged
	// out, maybe on another replica, and must not be recreated.
	Update(ctx context.Context, s *persistedSession) error
	// Get returns nil, nil when there is no such session.
	Get(ctx context.Context, sessionToken string) (*persistedSession, error)
	Delete(ctx context.Context, sessionToken string) error
	// Prune deletes sessions whose access token expired and that cannot be
	// refreshed, and sessions not updated for longer than maxAge.
	Prune(ctx context.Context, maxAge time.Duration) error
}

// persistedSession is everything needed to rebuild a LoginState.
type persistedSession struct {
	UserID         string    `json:"userID"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Exp            time.Time `json:"exp"`
	RotateAt       time.Time `json:"rotateAt"`
	SessionToken   string    `json:"sessionToken"`
	RawToken       string    `json:"rawToken"`
	RefreshToken   string    `json:"refreshToken"`
	RefreshTokenID string    `json:"refreshTokenID"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

func newPersistedSession(ls *LoginState) *persistedSession {
	return &persistedSession{
		UserID:         ls.userID,
		Name:           ls.name,
		Email:          ls.email,
		Exp:            ls.exp,
		RotateAt:       ls.rotateAt,
		SessionToken:   ls.sessionToken,
		RawToken:       ls.rawToken,
		RefreshToken:   ls.refreshToken,
		RefreshTokenID: ls.refreshTokenID,
	}
}

func (s *persistedSession) loginState() *LoginState {
	return &LoginState{
		userID:         s.UserID,
		name:           s.Name,
		email:          s.Email,
		exp:            s.Exp,
		rotateAt:       s.RotateAt,
		now:            time.Now,
		sessionToken:   s.SessionToken,
		rawToken:       s.RawToken,
		refreshToken:   s.RefreshToken,
		refreshTokenID: s.RefreshTokenID,
	}
}

// SecretPersister stores each session in its own Secret.
type SecretPersister struct {
	secrets corev1client.SecretInterface
	now     nowFunc
}

func NewSecretPersister(secrets corev1client.SecretInterface) *SecretPersister {
	return &SecretPersister{secrets: secrets, now: time.Now}
}

// sessionSecretName never contains the session token itself: anyone who can
// list Secrets must not learn a usable cookie value.
func sessionSecretName(sessionToken string) string {
	sum := sha256.Sum256([]byte(sessionToken))
	return sessionSecretPrefix + hex.EncodeToString(sum[:])
}

func (p *SecretPersister) Create(ctx context.Context, s *persistedSession) error {
	secret, err := p.secret(s)
	if err != nil {
		return err
	}
	_, err = p.secrets.Create(ctx, secret, metav1.CreateOptions{})
	return err
}

func (p *SecretPersister) Update(ctx context.Context, s *persistedSession) error {
	secret, err := p.secret(s)
	if err != nil {
		return err
	}
	// Secrets are never created by an update, so a logged-out session stays gone.
	_, err = p.secrets.Update(ctx, secret, metav1.UpdateOptions{})
	if apierrors.IsNotFound(err) {
		return errSessionDeleted
	}
	return err
}

func (p *SecretPersister) secret(s *persistedSession) (*corev1.Secret, error) {
	record := *s
	record.UpdatedAt = p.now()
	data, err := json.Marshal(&record)
	if err != nil {
		return nil, err
	}

	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:   sessionSecretName(s.SessionToken),
			Labels: map[string]string{sessionLabel: "true"},
		},
		Type: corev1.SecretTypeOpaque,
		Data: map[string][]byte{sessionSecretKey: data},
	}, nil
}

func (p *SecretPersister) Get(ctx context.Context, sessionToken string) (*persistedSession, error) {
	secret, err := p.secrets.Get(ctx, sessionSecretName(sessionToken), metav1.GetOptions{})
	if apierrors.IsNotFound(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return decodeSessionSecret(secret)
}

func (p *SecretPersister) Delete(ctx context.Context, sessionToken string) error {
	err := p.secrets.Delete(ctx, sessionSecretName(sessionToken), metav1.DeleteOptions{})
	if apierrors.IsNotFound(err) {
		return nil
	}
	return err
}

func (p *SecretPersister) Prune(ctx context.Context, maxAge time.Duration) error {
	list, err := p.secrets.List(ctx, metav1.ListOptions{
		LabelSelector: labels.SelectorFromSet(labels.Set{sessionLabel: "true"}).String(),
	})
	if err != nil {
		return err
	}

	now := p.now()
	pruned := 0
	for i := range list.Items {
		secret := &list.Items[i]
		s, err := decodeSessionSecret(secret)
		// An undecodable Secret can never be loaded, so it is as good as stale.
		stale := err != nil ||
			now.Sub(s.UpdatedAt) > maxAge ||
			(now.After(s.Exp) && s.RefreshToken == "")
		if !stale {
			continue
		}
		// The precondition skips Secrets updated since the List. Another replica
		// pruning the same Secret first makes this a harmless NotFound.
		rv := secret.ResourceVersion
		err = p.secrets.Delete(ctx, secret.Name, metav1.DeleteOptions{
			Preconditions: &metav1.Preconditions{ResourceVersion: &rv},
		})
		switch {
		case err == nil:
			pruned++
		case apierrors.IsNotFound(err), apierrors.IsConflict(err):
		default:
			klog.Errorf("failed to prune session secret %s: %v", secret.Name, err)
		}
	}
	klog.V(4).Infof("Pruned %d session secrets.", pruned)
	return nil
}

func decodeSessionSecret(secret *corev1.Secret) (*persistedSession, error) {
	s := &persistedSession{}
	if err := json.Unmarshal(secret.Data[sessionSecretKey], s); err != nil {
		return nil, fmt.Errorf("failed to decode session secret %s: %w", secret.Name, err)
	}
	return s, nil
}
