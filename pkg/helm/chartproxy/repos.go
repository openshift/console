package chartproxy

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"sigs.k8s.io/yaml"
	"strings"

	"helm.sh/helm/v3/pkg/repo"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	corev1 "k8s.io/client-go/kubernetes/typed/core/v1"

	"github.com/openshift/library-go/pkg/crypto"
)

var (
	helmChartRepositoryGVK = schema.GroupVersionResource{
		Group:    "helm.openshift.io",
		Version:  "v1beta1",
		Resource: "helmchartrepositories",
	}
)

const (
	configNamespace = "openshift-config"
)

type helmRepo struct {
	Name            string
	Url             *url.URL
	TlsClientConfig *tls.Config
}

type TLSConfigGetter interface {
	Get() (*tls.Config, error)
}

func (repo helmRepo) Get() (*tls.Config, error) {
	return repo.TlsClientConfig, nil
}

func (repo helmRepo) httpClient() (*http.Client, error) {
	tlsConfig, err := repo.Get()
	if err != nil {
		return nil, err
	}
	tr := &http.Transport{
		TLSClientConfig: tlsConfig,
	}

	client := &http.Client{Transport: tr}
	return client, nil
}

func (hr helmRepo) IndexFile() (*repo.IndexFile, error) {
	var indexFile repo.IndexFile
	httpClient, err := hr.httpClient()
	if err != nil {
		return nil, err
	}
	indexUrl := hr.Url.String()
	if !strings.HasSuffix(indexUrl, "/index.yaml") {
		indexUrl += "/index.yaml"
	}
	resp, err := httpClient.Get(indexUrl)
	if err != nil {
		return nil, err
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	err = yaml.Unmarshal(body, &indexFile)
	if err != nil {
		return nil, err
	}
	return &indexFile, nil
}

type HelmRepoGetter interface {
	List() ([]*helmRepo, error)
}

type helmRepoGetter struct {
	Client     dynamic.Interface
	CoreClient corev1.CoreV1Interface
}

func (b helmRepoGetter) unmarshallConfig(repo unstructured.Unstructured) (*helmRepo, error) {
	h := &helmRepo{}
	urlValue, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "url")
	if err != nil {
		return nil, err
	}

	h.Url, err = url.Parse(urlValue)
	if err != nil {
		return nil, err
	}

	h.Name, _, err = unstructured.NestedString(repo.Object, "metadata", "name")
	if err != nil {
		return nil, err
	}

	caReference, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "ca", "name")
	if err != nil {
		return nil, err
	}

	tlsReference, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "tlsClientConfig", "name")
	if err != nil {
		return nil, err
	}

	var rootCAs *x509.CertPool
	if caReference != "" {
		caCert, err := b.configMapValue(caReference, "ca-bundle.crt")
		if err != nil {
			return nil, err
		}
		if caCert != nil {
			rootCAs = x509.NewCertPool()
			if ok := rootCAs.AppendCertsFromPEM(caCert); !ok {
				return nil, errors.New("Failed to append caCert")
			}
		}
	}
	if rootCAs == nil {
		rootCAs, err = x509.SystemCertPool()
		if err != nil {
			return nil, err
		}
	}
	h.TlsClientConfig = &tls.Config{
		RootCAs:      rootCAs,
		CipherSuites: crypto.DefaultCiphers(),
	}
	if tlsReference != "" {
		tlsCert, err := b.secretValue(tlsReference, "tls.crt")
		if err != nil {
			return nil, err
		}
		tlsKey, err := b.secretValue(tlsReference, "tls.key")
		if err != nil {
			return nil, err
		}
		if tlsKey != nil && tlsCert != nil {
			cert, err := tls.X509KeyPair(tlsCert, tlsKey)
			if err != nil {
				return nil, err
			}
			h.TlsClientConfig.Certificates = []tls.Certificate{cert}
		}
	}
	return h, nil
}

func mergeIndexFiles(files ...*repo.IndexFile) *repo.IndexFile {
	indexFile := repo.NewIndexFile()
	for _, file := range files {
		for key, entry := range file.Entries {
			indexFile.Entries[key] = entry
		}
	}
	return indexFile
}

func (b helmRepoGetter) configMapValue(name string, dataField string) ([]byte, error) {
	configMap, err := b.CoreClient.ConfigMaps(configNamespace).Get(context.TODO(), name, v1.GetOptions{})
	if err != nil {
		return nil, errors.New(fmt.Sprintf("Failed to find %s key in configmap %s", dataField, name))
	}
	if val, ok := configMap.Data[dataField]; ok {
		return []byte(val), nil
	}
	return nil, errors.New(fmt.Sprintf("Failed to find %s key in configmap %s", dataField, name))
}

func (b helmRepoGetter) secretValue(name string, dataField string) ([]byte, error) {
	secret, err := b.CoreClient.Secrets(configNamespace).Get(context.TODO(), name, v1.GetOptions{})
	if err != nil {
		return nil, errors.New(fmt.Sprintf("Failed to find %s key in secret %s", dataField, name))

	}
	if val, ok := secret.Data[dataField]; ok {
		return val, nil
	}
	return nil, errors.New(fmt.Sprintf("Failed to find %s key in secret %s", dataField, name))
}

func (b *helmRepoGetter) List() ([]*helmRepo, error) {
	var helmRepos []*helmRepo
	repos, err := b.Client.Resource(helmChartRepositoryGVK).List(context.TODO(), v1.ListOptions{})
	if err != nil || len(repos.Items) == 0 {
		// In case no HelmRepoCRs configured, use default redhat helm chart repo
		helmRepos = append(helmRepos, &DefaultRepo)
		return helmRepos, nil
	}
	for _, item := range repos.Items {
		helmConfig, err := b.unmarshallConfig(item)
		if err != nil {
			return nil, err
		}
		helmRepos = append(helmRepos, helmConfig)
	}
	return helmRepos, nil
}

func NewRepoGetter(client dynamic.Interface, corev1Client corev1.CoreV1Interface) HelmRepoGetter {
	return &helmRepoGetter{
		Client:     client,
		CoreClient: corev1Client,
	}
}
