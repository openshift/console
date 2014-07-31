package proxy

import (
	"net/http"
	"net/url"
)

const (
	basePath = "/api/v1beta1/"
)

type K8Proxy struct {
	baseProxy
}

func NewK8Proxy(apiUrl, localPrefix string) (*K8Proxy, error) {
	remoteUrl, err := url.Parse(apiUrl)
	if err != nil {
		return nil, err
	}

	p := K8Proxy{}
	p.HttpClient = &http.Client{}
	p.RemoteUrl = remoteUrl
	p.LocalPrefix = localPrefix
	p.RequestHeaderBlacklist = []string{"Cookie", "User-Agent"}

	return &p, nil
}
