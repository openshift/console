package terminal

import (
	"context"

	authv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// isClusterAdmin does a subject access review to see if the user can create pods in openshift-terminal
// if they can then they are considered a cluster admin
// if they cannot they are not a cluster admin
func (p *Proxy) isClusterAdmin(token string) (bool, error) {
	client, err := p.createTypedClient(token)
	if err != nil {
		return false, err
	}

	sar := &authv1.SelfSubjectAccessReview{
		Spec: authv1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authv1.ResourceAttributes{
				Namespace: "openshift-terminal",
				Verb:      "create",
				Resource:  "pods",
			},
		},
	}
	res, err := client.AuthorizationV1().SelfSubjectAccessReviews().Create(context.TODO(), sar, metav1.CreateOptions{})
	if err != nil || res == nil {
		return false, err
	}
	return res.Status.Allowed, nil
}
