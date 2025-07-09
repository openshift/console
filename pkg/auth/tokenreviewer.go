package auth

import (
	"context"
	"errors"
	"fmt"

	authv1 "k8s.io/api/authentication/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

type TokenReviewer struct {
	clientSet *kubernetes.Clientset
}

func NewTokenReviewer(k8sRestConfig *rest.Config) (*TokenReviewer, error) {
	clientSet, err := kubernetes.NewForConfig(k8sRestConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create K8s Clientset for TokenReviewer: %v", err)
	}
	return &TokenReviewer{
		clientSet: clientSet,
	}, nil
}

func (t *TokenReviewer) ReviewToken(ctx context.Context, token string) error {
	tokenReview := &authv1.TokenReview{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "authentication.k8s.io/v1",
			Kind:       "TokenReview",
		},
		Spec: authv1.TokenReviewSpec{
			Token: token,
		},
	}

	completedTokenReview, err := t.
		clientSet.
		AuthenticationV1().
		TokenReviews().
		Create(ctx, tokenReview, metav1.CreateOptions{})

	if err != nil {
		return fmt.Errorf("failed to create TokenReview, %v", err)
	}

	// Check if the token is authenticated
	if !completedTokenReview.Status.Authenticated {
		if completedTokenReview.Status.Error != "" {
			return errors.New(completedTokenReview.Status.Error)
		}
		return errors.New("failed to authenticate the token, unknownd error")
	}
	return nil
}
