package proxy

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/coreos-inc/bridge/config"
)

const (
	basePath = "/api/v1beta1/"
)

type K8Proxy struct {
	baseProxy
}

func NewK8Proxy(localPrefix string) (*K8Proxy, error) {
	remoteUrl, err := url.Parse(fmt.Sprintf("%s/api/v1beta1", *config.K8Url))
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
