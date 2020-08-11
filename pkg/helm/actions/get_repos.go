package actions

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"helm.sh/helm/v3/pkg/repo"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	corev1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"sigs.k8s.io/yaml"

	oscrypto "github.com/openshift/library-go/pkg/crypto"
)

var (
	helmChartRepositoryGVK = schema.GroupVersionResource{
		Group:    "helm.openshift.io",
		Version:  "v1beta1",
		Resource: "helmchartrepositories",
	}

	defaultRepo = unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "helm.openshift.io/v1beta1",
			"kind":       "HelmChartRepository",
			"metadata": map[string]interface{}{
				"namespace": "",
				"name":      "redhat-helm-chart",
			},
			"spec": map[string]interface{}{
				"connectionConfig": map[string]interface{}{
					"url": "https://redhat-developer.github.io/redhat-helm-charts",
				},
			},
		},
	}
)

const (
	configNamespace = "openshift-config"
)

type TLSConfigGetter interface {
	Get() (*tls.Config, error)
}

type HelmConfigGetter struct {
	Client     dynamic.Interface
	CoreClient corev1.CoreV1Interface

	DefaultRepoCACertificate []byte
}

func (b HelmConfigGetter) IndexFiles(helmConfigs []*HelmConfig) []*repo.IndexFile {
	var indexFiles []*repo.IndexFile
	for _, helmConfig := range helmConfigs {
		indexFile, err := b.IndexFile(helmConfig)
		if err != nil {
			plog.Errorf("Failed to load helm IndexFile %s", err.Error())
		}
		indexFiles = append(indexFiles, indexFile)
	}
	return indexFiles
}

func (b HelmConfigGetter) parseHelmConfig(repo unstructured.Unstructured) (*HelmConfig, error) {
	h := &HelmConfig{}
	url, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "url")
	if err != nil {
		return nil, err
	}

	name, _, err := unstructured.NestedString(repo.Object, "metadata", "name")
	if err != nil {
		return nil, err
	}

	caReference, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "ca", "name")
	if err != nil {
		return nil, err
	}

	tlsReference, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "tlsconfig", "name")
	if err != nil {
		return nil, err
	}

	h.Name = name
	if caReference != "" {
		h.CACert, err = b.ConfigMapValue(caReference, "ca-bundle.crt")
		if err != nil {
			return nil, err
		}
	}
	if tlsReference != "" {
		h.TLSCert, err = b.SecretValue(tlsReference, "tls.crt")
		if err != nil {
			return nil, err
		}
		h.TLSKey, err = b.SecretValue(tlsReference, "tls.key")
		if err != nil {
			return nil, err
		}
	}
	h.Url = url
	return h, nil
}

func (b HelmConfigGetter) MergeIndexFiles(files ...*repo.IndexFile) *repo.IndexFile {
	indexFile := repo.NewIndexFile()
	for _, file := range files {
		for key, entry := range file.Entries {
			indexFile.Entries[key] = entry
		}
	}
	return indexFile
}

func (b HelmConfigGetter) ConfigMapValue(name string, dataField string) ([]byte, error) {
	configMap, err := b.CoreClient.ConfigMaps(configNamespace).Get(context.TODO(), name, v1.GetOptions{})
	if err != nil {
		return nil, errors.New(fmt.Sprintf("Failed to find %s key in configmap %s", dataField, name))
	}
	if val, ok := configMap.Data[dataField]; ok {
		return []byte(val), nil
	}
	return nil, errors.New(fmt.Sprintf("Failed to find %s key in configmap %s", dataField, name))
}

func (b HelmConfigGetter) SecretValue(name string, dataField string) ([]byte, error) {
	secret, err := b.CoreClient.Secrets(configNamespace).Get(context.TODO(), name, v1.GetOptions{})
	if err != nil {
		return nil, errors.New(fmt.Sprintf("Failed to find %s key in secret %s", dataField, name))

	}
	if val, ok := secret.Data[dataField]; ok {
		return val, nil
	}
	return nil, errors.New(fmt.Sprintf("Failed to find %s key in secret %s", dataField, name))
}

type HelmConfig struct {
	Name    string
	Url     string
	CACert  []byte
	TLSCert []byte
	TLSKey  []byte
}

func (b HelmConfigGetter) Get(caCert, tlsCert, tlsKey []byte) (*tls.Config, error) {
	mTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{})
	var rootCAs *x509.CertPool
	var err error

	if caCert != nil {
		rootCAs = x509.NewCertPool()
		if ok := rootCAs.AppendCertsFromPEM(caCert); !ok {
			return nil, errors.New("Failed to append caCert")
		}
	} else {
		rootCAs, err = x509.SystemCertPool()
		if err != nil {
			return nil, err
		}
	}
	mTLSConfig.ClientCAs = rootCAs

	if tlsKey != nil && tlsCert != nil {
		cert, err := tls.X509KeyPair(tlsCert, tlsKey)
		if err != nil {
			return nil, err
		}
		mTLSConfig.Certificates = []tls.Certificate{cert}
	}
	return mTLSConfig, nil
}

func (b HelmConfigGetter) HttpClient(helmConfig *HelmConfig) (*http.Client, error) {
	mTLSConfig, err := b.Get(helmConfig.CACert, helmConfig.TLSCert, helmConfig.TLSKey)
	if err != nil {
		return nil, err
	}
	tr := &http.Transport{
		TLSClientConfig: mTLSConfig,
	}

	client := &http.Client{Transport: tr}
	return client, nil
}

func (b HelmConfigGetter) IndexFile(helmConfig *HelmConfig) (*repo.IndexFile, error) {
	plog.Println("HelmConfig", helmConfig)
	var indexFile repo.IndexFile
	httpClient, err := b.HttpClient(helmConfig)
	if err != nil {
		return nil, err
	}
	if !strings.HasSuffix(helmConfig.Url, "/index.yaml") {
		helmConfig.Url += "/index.yaml"
	}
	resp, err := httpClient.Get(helmConfig.Url)
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

func (b *HelmConfigGetter) List() ([]*HelmConfig, error) {
	var helmConfigs []*HelmConfig
	repos, err := b.Client.Resource(helmChartRepositoryGVK).List(context.TODO(), v1.ListOptions{})
	if err != nil || len(repos.Items) == 0 {
		// In case no HelmRepoCRs configured, use default redhat helm chart repo
		helmConfig, err := b.parseHelmConfig(defaultRepo)
		if err != nil {
			return helmConfigs, nil
		}
		helmConfig.CACert = b.DefaultRepoCACertificate
		helmConfigs = append(helmConfigs, helmConfig)
		return helmConfigs, nil
	}
	for _, item := range repos.Items {
		helmConfig, err := b.parseHelmConfig(item)
		if err != nil {
			return nil, err
		}
		helmConfigs = append(helmConfigs, helmConfig)
	}
	return helmConfigs, nil
}

func newHelmConfigGetter(client dynamic.Interface, corev1Client corev1.CoreV1Interface, defaultRepoCACerts []byte) (*HelmConfigGetter, error) {
	helmConfigGetter := &HelmConfigGetter{
		Client:                   client,
		CoreClient:               corev1Client,
		DefaultRepoCACertificate: defaultRepoCACerts,
	}
	return helmConfigGetter, nil
}

func FetchIndexFile(client dynamic.Interface, corev1Client corev1.CoreV1Interface, defaultRepoCACerts []byte) (*repo.IndexFile, error) {
	helmConfigBuilder, err := newHelmConfigGetter(client, corev1Client, defaultRepoCACerts)
	if err != nil {
		return nil, err
	}

	helmConfigs, err := helmConfigBuilder.List()
	if err != nil {
		return nil, err
	}

	indexFiles := helmConfigBuilder.IndexFiles(helmConfigs)
	indexFile := helmConfigBuilder.MergeIndexFiles(indexFiles...)

	return indexFile, nil
}
