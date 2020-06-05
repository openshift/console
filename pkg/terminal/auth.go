package terminal

import (
	"context"

	authv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// checkUserPermissions checks if the terminal proxy is supported for a given user.
// Returns true if we're willing to proxy the user's token, false otherwise. We don't
// want to proxy highly privileged tokens to avoid privilege escalation issues.
func (p *Proxy) checkUserPermissions(token string) (bool, error) {
	client, err := p.createTypedClient(token)
	if err != nil {
		return false, err
	}

	sar := &authv1.SelfSubjectAccessReview{
		Spec: authv1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authv1.ResourceAttributes{
				Namespace: "openshift-operators",
				Verb:      "create",
				Resource:  "pods",
			},
		},
	}
	res, err := client.AuthorizationV1().SelfSubjectAccessReviews().Create(context.TODO(), sar, metav1.CreateOptions{})
	if err != nil || res == nil {
		return false, err
	}
	return !res.Status.Allowed, nil
}
