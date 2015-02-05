package proxy

import (
	"fmt"
	"net/http"
	"net/url"
)

const (
	basePath = "/api/v1beta2/"
)

type K8sProxy struct {
	baseProxy
	apiVersion string
	endpoint   string
}

func NewK8sProxy(endpoint, apiVersion, localPrefix string) (*K8sProxy, error) {
	remoteUrl, err := url.Parse(fmt.Sprintf("%s/api/%s", endpoint, apiVersion))
	if err != nil {
		return nil, err
	}

	p := &K8sProxy{
		endpoint:   endpoint,
		apiVersion: apiVersion,
	}
	p.HttpClient = &http.Client{}
	p.RemoteUrl = remoteUrl
	p.LocalPrefix = localPrefix
	p.RequestHeaderBlacklist = []string{"Cookie", "User-Agent"}

	return p, nil
}
