package chartproxy

import (
	"sort"
	"strings"

	"helm.sh/helm/v3/pkg/chartutil"
	"helm.sh/helm/v3/pkg/repo"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	v1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"

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
	IndexFile(onlyCompatible bool, namespace string) (*repo.IndexFile, error)
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

func (p *proxy) IndexFile(onlyCompatible bool, namespace string) (*repo.IndexFile, error) {
	helmRepos, err := p.helmRepoGetter.List(namespace)
	if err != nil {
		return nil, err
	}
	annotations := make(map[string]string)
	var invalidRepos []string
	indexFile := repo.NewIndexFile()
	var delKeys []string = make([]string, 0, 20)
	for _, helmRepo := range helmRepos {
		overwrites := helmRepo.OverwrittenRepoName()
		if !helmRepo.Disabled {
			idxFile, err := helmRepo.IndexFile()
			if err != nil {
				invalidRepos = append(invalidRepos, helmRepo.Name)
				klog.Errorf("Error retrieving index file for %v: %v", helmRepo, err)
				continue
			}

			for key, entries := range idxFile.Entries {
				for i := len(entries) - 1; i >= 0; i-- {
					if entries[i] == nil || entries[i].Metadata == nil {
						klog.Warningf("Helm chart %v from repository %v has an invalid entry at index %v", key, helmRepo.Name, i)
						entries = append(entries[:i], entries[i+1:]...)
						continue
					}
					if entries[i].Type == "library" {
						entries = append(entries[:i], entries[i+1:]...)
						continue
					}
					if onlyCompatible && entries[i].Metadata.KubeVersion != "" && p.kubeVersion != "" {
						if !chartutil.IsCompatibleRange(entries[i].Metadata.KubeVersion, p.kubeVersion) {
							entries = append(entries[:i], entries[i+1:]...)
						}
					}
				}
				if len(entries) > 0 {
					if overwrites != "" {
						// Adding potential duplicates to the list
						delKeys = append(delKeys, entries[0].Name+"--"+overwrites)
					}

					sort.Slice(entries, func(i, j int) bool {
						return entries[i].Version < entries[j].Version
					})

					indexFile.Entries[key+"--"+helmRepo.Name] = entries
				}
			}
		}
	}
	if invalidRepos != nil {
		annotations[warning] = ErrorMessage + strings.Join(invalidRepos, ", ")
		indexFile.Annotations = annotations
	}

	for _, delKey := range delKeys {
		// If duplicate is found in entries it will delete it, if not found it is a noop
		delete(indexFile.Entries, delKey)
	}
	return indexFile, nil
}
