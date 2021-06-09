package chartproxy

import (
	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/repo"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	v1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/client-go/rest"
	"k8s.io/klog"

	"github.com/openshift/console/pkg/version"
)

type proxy struct {
	config         *rest.Config
	dynamicClient  dynamic.Interface
	coreV1Client   v1.CoreV1Interface
	helmRepoGetter HelmRepoGetter
	kubeVersion    string
}

type Proxy interface {
	IndexFile(onlyCompatible bool) (*repo.IndexFile, error)
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

func New(k8sConfig RestConfigProvider, kubeVersionGetter version.KubeVersionGetter, opts ...ProxyOption) (Proxy, error) {
	config, err := k8sConfig()

	if err != nil {
		return nil, err
	}

	p := &proxy{
		config:      config,
		kubeVersion: kubeVersionGetter.GetKubeVersion(),
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

func (p *proxy) IndexFile(onlyCompatible bool) (*repo.IndexFile, error) {
	helmRepos, err := p.helmRepoGetter.List()
	if err != nil {
		return nil, err
	}

	indexFile := repo.NewIndexFile()
	var delKeys []string = make([]string, 0, 20)
	for _, helmRepo := range helmRepos {
		overwrites := helmRepo.OverwrittenRepoName()
		if !helmRepo.Disabled {
			idxFile, err := helmRepo.IndexFile()
			if err != nil {
				klog.Errorf("Error retrieving index file for %v: %v", helmRepo, err)
				continue
			}

			for key, entry := range idxFile.Entries {
				for i := len(entry) - 1; i >= 0; i-- {
					if entry[i].Type == "library" {
						entry = append(entry[:i], entry[i+1:]...)
						continue
					}
					if onlyCompatible && entry[i].Metadata.KubeVersion != "" && p.kubeVersion != "" {
						if !chartutil.IsCompatibleRange(entry[i].Metadata.KubeVersion, p.kubeVersion) {
							entry = append(entry[:i], entry[i+1:]...)
						}
					}
				}
				if len(entry) > 0 {
					if overwrites != "" {
						// Adding potential duplicates to the list
						delKeys = append(delKeys, entry[0].Name+"--"+overwrites)
					}

					indexFile.Entries[key+"--"+helmRepo.Name] = entry
				}
			}
		}
	}

	for _, delKey := range delKeys {
		// If duplicate is found in entries it will delete it, if not found it is a noop
		delete(indexFile.Entries, delKey)
	}
	return indexFile, nil
}
