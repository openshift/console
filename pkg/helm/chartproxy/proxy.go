package chartproxy

import (
	"helm.sh/helm/v3/pkg/repo"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	v1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/client-go/rest"
	"k8s.io/klog"
)

type proxy struct {
	config         *rest.Config
	dynamicClient  dynamic.Interface
	coreV1Client   v1.CoreV1Interface
	helmRepoGetter HelmRepoGetter
}

type Proxy interface {
	IndexFile() (*repo.IndexFile, error)
}

type RestConfigProvider func() (*rest.Config, error)

type ProxyOption func(p *proxy) error

func dynamicKubeClientProvider(p *proxy) error {
	client, err := dynamic.NewForConfig(p.config)
	if err != nil {
		return err
	}
	p.dynamicClient = client
	return nil
}

func coreClientProvider(p *proxy) error {
	client, err := kubernetes.NewForConfig(p.config)
	if err != nil {
		return err
	}
	p.coreV1Client = client.CoreV1()
	return nil
}

var defaultOptions = []ProxyOption{dynamicKubeClientProvider, coreClientProvider}

func New(k8sConfig RestConfigProvider, opts ...ProxyOption) (Proxy, error) {
	config, err := k8sConfig()
	if err != nil {
		return nil, err
	}
	p := &proxy{
		config: config,
	}

	if len(opts) == 0 {
		opts = defaultOptions
	}

	for _, opt := range opts {
		opt(p)
	}
	p.helmRepoGetter = NewRepoGetter(p.dynamicClient, p.coreV1Client)
	return p, nil
}

func (p *proxy) IndexFile() (*repo.IndexFile, error) {
	helmRepos, err := p.helmRepoGetter.List()
	if err != nil {
		return nil, err
	}

	indexFile := repo.NewIndexFile()
	for _, helmRepo := range helmRepos {
		idxFile, err := helmRepo.IndexFile()
		if err != nil {
			klog.Errorf("Error retrieving index file for %v: %v", helmRepo, err)
			continue
		}
		for key, entry := range idxFile.Entries {
			indexFile.Entries[key+"--"+helmRepo.Name] = entry
		}
	}
	return indexFile, nil
}
