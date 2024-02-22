package resolver

import (
	"bytes"
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"

	authn "k8s.io/api/authentication/v1"
	authz "k8s.io/api/authorization/v1"
	"k8s.io/klog"

	"github.com/openshift/console/pkg/proxy"
)

type K8sResolver struct {
	K8sProxy *proxy.Proxy
}

func (r *K8sResolver) FetchURL(ctx context.Context, args struct{ URL string }) (*string, error) {
	request, err := http.NewRequest("GET", args.URL, nil)
	if err != nil {
		return nil, err
	}
	contextToHeaders(ctx, request)
	rr := httptest.NewRecorder()
	r.K8sProxy.ServeHTTP(rr, request)
	result := rr.Result()
	defer result.Body.Close()
	body, err := ioutil.ReadAll(result.Body)
	if err != nil {
		return nil, err
	}
	stringBody := string(body)
	if result.StatusCode < 200 || result.StatusCode > 299 {
		return nil, resolverError{Status: result.StatusCode, Message: stringBody}
	}
	return &stringBody, err
}

type SSARArgs struct {
	Group     *string `json:"group"`
	Resource  *string `json:"resource"`
	Verb      *string `json:"verb"`
	Namespace *string `json:"namespace"`
}

func parseArgs(args SSARArgs) *authz.ResourceAttributes {
	attr := authz.ResourceAttributes{}
	if args.Namespace != nil {
		attr.Namespace = *args.Namespace
	}
	if args.Verb != nil {
		attr.Verb = *args.Verb
	}
	if args.Resource != nil {
		attr.Resource = *args.Resource
	}
	if args.Group != nil {
		attr.Group = *args.Group
	}
	return &attr
}

// This is a modified copy o k8s.io/api/authentication/v1 types,
// so we can serialize SelfSubjectReview.Status.UserInfo.Extra
// In the UserInfo struct we needed to modify so that the `Extra`
// field is a string rather then a object cause GraphQL is not
// able to handle objects.
type SelfSubjectReview struct {
	Status SelfSubjectReviewStatus `json:"status,omitempty"`
}

type SelfSubjectReviewStatus struct {
	UserInfo UserInfo `json:"userInfo,omitempty"`
}

type UserInfo struct {
	Username string   `json:"username,omitempty"`
	UID      string   `json:"uid,omitempty"`
	Groups   []string `json:"groups,omitempty"`
	Extra    string   `json:"extra,omitempty"`
}

func (r *K8sResolver) SelfSubjectReview(ctx context.Context) (*SelfSubjectReview, error) {
	spec := authn.SelfSubjectReview{}
	buf := new(bytes.Buffer)
	json.NewEncoder(buf).Encode(&spec)
	request, err := http.NewRequest("POST", "/apis/"+authn.SchemeGroupVersion.String()+"/selfsubjectreviews", buf)
	if err != nil {
		return nil, err
	}
	contextToHeaders(ctx, request)
	rr := httptest.NewRecorder()
	r.K8sProxy.ServeHTTP(rr, request)
	result := rr.Result()
	defer result.Body.Close()
	if result.StatusCode < 200 || result.StatusCode > 299 {
		body, err := ioutil.ReadAll(result.Body)
		if err != nil {
			return nil, err
		}
		return nil, resolverError{Status: result.StatusCode, Message: string(body)}
	}
	ssr := authn.SelfSubjectReview{}
	if err := json.NewDecoder(result.Body).Decode(&ssr); err != nil {
		klog.Errorf("failed to encode SelfSubjectReview: %v", err)
		return nil, err
	}

	convertedSSR := SelfSubjectReview{}
	convertedSSR.Status.UserInfo.Username = ssr.Status.UserInfo.Username
	convertedSSR.Status.UserInfo.UID = ssr.Status.UserInfo.UID
	convertedSSR.Status.UserInfo.Groups = ssr.Status.UserInfo.Groups
	userExtraBytes, err := json.Marshal(ssr.Status.UserInfo.Extra)
	if err != nil {
		klog.Errorf("failed to marshal userInfo.Extra: %v", err)
		return nil, err
	}

	convertedSSR.Status.UserInfo.Extra = string(userExtraBytes)

	return &convertedSSR, err
}

func (r *K8sResolver) SelfSubjectAccessReview(ctx context.Context, args SSARArgs) (*authz.SelfSubjectAccessReview, error) {
	spec := authz.SelfSubjectAccessReview{
		Spec: authz.SelfSubjectAccessReviewSpec{
			ResourceAttributes: parseArgs(args),
		},
	}
	buf := new(bytes.Buffer)
	json.NewEncoder(buf).Encode(&spec)
	request, err := http.NewRequest("POST", "/apis/"+authz.SchemeGroupVersion.String()+"/selfsubjectaccessreviews", buf)
	if err != nil {
		return nil, err
	}
	contextToHeaders(ctx, request)
	rr := httptest.NewRecorder()
	r.K8sProxy.ServeHTTP(rr, request)
	result := rr.Result()
	defer result.Body.Close()
	if result.StatusCode < 200 || result.StatusCode > 299 {
		body, err := ioutil.ReadAll(result.Body)
		if err != nil {
			return nil, err
		}
		return nil, resolverError{Status: result.StatusCode, Message: string(body)}
	}
	ssar := authz.SelfSubjectAccessReview{}
	err = json.NewDecoder(result.Body).Decode(&ssar)
	return &ssar, err
}
