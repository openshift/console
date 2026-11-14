package main

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"slices"
	"sync"
	"time"

	authnv1 "k8s.io/api/authentication/v1"
	authzv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// errUnauthenticated means the API server rejected the bearer token.
var errUnauthenticated = errors.New("token is not authenticated")

// Access is the set of namespaces a user may read logs from.
type Access struct {
	// All is true when the user may read pod logs in every namespace.
	All bool
	// Namespaces lists the namespaces the user may read pod logs in, sorted.
	// Only meaningful when All is false.
	Namespaces []string
}

// Authorizer answers "who is this token" (TokenReview) and "which namespaces
// may they read logs in" (SubjectAccessReview for get pods/log), the same
// checks kube-rbac-proxy makes. Results are cached for ttl so a page load's
// burst of queries costs one round of reviews.
type Authorizer struct {
	client kubernetes.Interface
	ttl    time.Duration
	now    func() time.Time
	// parallel bounds concurrent SubjectAccessReviews for one user.
	parallel int

	mu     sync.Mutex
	users  map[[sha256.Size]byte]cached[*authnv1.UserInfo]
	access map[string]cached[Access]
}

type cached[T any] struct {
	value   T
	expires time.Time
}

func NewAuthorizer(client kubernetes.Interface, ttl time.Duration) *Authorizer {
	return &Authorizer{
		client:   client,
		ttl:      ttl,
		now:      time.Now,
		parallel: 8,
		users:    map[[sha256.Size]byte]cached[*authnv1.UserInfo]{},
		access:   map[string]cached[Access]{},
	}
}

// Authenticate returns the user a bearer token belongs to, or errUnauthenticated.
func (a *Authorizer) Authenticate(ctx context.Context, token string) (*authnv1.UserInfo, error) {
	key := sha256.Sum256([]byte(token))
	if user, ok := lookup(a, a.users, key); ok {
		return user, nil
	}

	review, err := a.client.AuthenticationV1().TokenReviews().Create(ctx, &authnv1.TokenReview{
		Spec: authnv1.TokenReviewSpec{Token: token},
	}, metav1.CreateOptions{})
	if err != nil {
		return nil, fmt.Errorf("token review: %w", err)
	}
	if !review.Status.Authenticated {
		return nil, errUnauthenticated
	}

	user := review.Status.User
	store(a, a.users, key, &user)
	return &user, nil
}

// Access returns the namespaces user may read pod logs in.
func (a *Authorizer) Access(ctx context.Context, user *authnv1.UserInfo) (Access, error) {
	key := userKey(user)
	if access, ok := lookup(a, a.access, key); ok {
		return access, nil
	}

	all, err := a.canReadLogs(ctx, user, "")
	if err != nil {
		return Access{}, err
	}
	if all {
		access := Access{All: true}
		store(a, a.access, key, access)
		return access, nil
	}

	namespaces, err := a.client.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return Access{}, fmt.Errorf("list namespaces: %w", err)
	}

	var (
		wg      sync.WaitGroup
		mu      sync.Mutex
		allowed []string
		errs    []error
		slots   = make(chan struct{}, a.parallel)
	)
	for _, ns := range namespaces.Items {
		wg.Add(1)
		slots <- struct{}{}
		go func(name string) {
			defer wg.Done()
			defer func() { <-slots }()
			ok, err := a.canReadLogs(ctx, user, name)
			mu.Lock()
			defer mu.Unlock()
			if err != nil {
				errs = append(errs, err)
			} else if ok {
				allowed = append(allowed, name)
			}
		}(ns.Name)
	}
	wg.Wait()
	if len(errs) > 0 {
		return Access{}, errors.Join(errs...)
	}

	slices.Sort(allowed)
	access := Access{Namespaces: allowed}
	store(a, a.access, key, access)
	return access, nil
}

// canReadLogs asks whether user may `get pods/log` in namespace ("" means in
// every namespace, granted by a ClusterRoleBinding).
func (a *Authorizer) canReadLogs(ctx context.Context, user *authnv1.UserInfo, namespace string) (bool, error) {
	extra := make(map[string]authzv1.ExtraValue, len(user.Extra))
	for k, v := range user.Extra {
		extra[k] = authzv1.ExtraValue(v)
	}
	review, err := a.client.AuthorizationV1().SubjectAccessReviews().Create(ctx, &authzv1.SubjectAccessReview{
		Spec: authzv1.SubjectAccessReviewSpec{
			User:   user.Username,
			UID:    user.UID,
			Groups: user.Groups,
			Extra:  extra,
			ResourceAttributes: &authzv1.ResourceAttributes{
				Namespace:   namespace,
				Verb:        "get",
				Resource:    "pods",
				Subresource: "log",
			},
		},
	}, metav1.CreateOptions{})
	if err != nil {
		return false, fmt.Errorf("subject access review (namespace %q): %w", namespace, err)
	}
	return review.Status.Allowed, nil
}

func userKey(user *authnv1.UserInfo) string {
	groups := slices.Clone(user.Groups)
	slices.Sort(groups)
	return fmt.Sprintf("%s\x00%s\x00%q", user.Username, user.UID, groups)
}

func lookup[K comparable, V any](a *Authorizer, m map[K]cached[V], key K) (V, bool) {
	a.mu.Lock()
	defer a.mu.Unlock()
	entry, ok := m[key]
	if !ok || a.now().After(entry.expires) {
		var zero V
		return zero, false
	}
	return entry.value, true
}

func store[K comparable, V any](a *Authorizer, m map[K]cached[V], key K, value V) {
	a.mu.Lock()
	defer a.mu.Unlock()
	now := a.now()
	for k, entry := range m {
		if now.After(entry.expires) {
			delete(m, k)
		}
	}
	m[key] = cached[V]{value: value, expires: now.Add(a.ttl)}
}
