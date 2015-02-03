package proxy

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/coreos-inc/bridge/config"
)

const (
	basePath = "/api/v1beta2/"
)

type K8sProxy struct {
	baseProxy
}

func NewK8sProxy(localPrefix string) (*K8sProxy, error) {
	remoteUrl, err := url.Parse(fmt.Sprintf("%s/api/v1beta2", *config.K8sUrl))
	if err != nil {
		return nil, err
	}

	p := K8sProxy{}
	p.HttpClient = &http.Client{}
	p.RemoteUrl = remoteUrl
	p.LocalPrefix = localPrefix
	p.RequestHeaderBlacklist = []string{"Cookie", "User-Agent"}

	return &p, nil
}
