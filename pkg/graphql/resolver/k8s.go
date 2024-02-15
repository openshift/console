package resolver

import (
	"bytes"
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"
	"net/http/httptest"

	authentication "k8s.io/api/authentication/v1"
	auth "k8s.io/api/authorization/v1"

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

func parseArgs(args SSARArgs) *auth.ResourceAttributes {
	attr := auth.ResourceAttributes{}
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
	spec := authentication.SelfSubjectReview{}
	buf := new(bytes.Buffer)
	json.NewEncoder(buf).Encode(&spec)
	request, err := http.NewRequest("POST", "/apis/"+authentication.SchemeGroupVersion.String()+"/selfsubjectreviews", buf)
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
	ssr := SelfSubjectReview{}
	err = json.NewDecoder(result.Body).Decode(&ssr)
	return &ssr, err
}

func (r *K8sResolver) SelfSubjectAccessReview(ctx context.Context, args SSARArgs) (*auth.SelfSubjectAccessReview, error) {
	spec := auth.SelfSubjectAccessReview{
		Spec: auth.SelfSubjectAccessReviewSpec{
			ResourceAttributes: parseArgs(args),
		},
	}
	buf := new(bytes.Buffer)
	json.NewEncoder(buf).Encode(&spec)
	request, err := http.NewRequest("POST", "/apis/"+auth.SchemeGroupVersion.String()+"/selfsubjectaccessreviews", buf)
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
	ssar := auth.SelfSubjectAccessReview{}
	err = json.NewDecoder(result.Body).Decode(&ssar)
	return &ssar, err
}
