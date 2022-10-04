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
	"strings"
	"time"

	"sigs.k8s.io/yaml"

	"helm.sh/helm/v3/pkg/repo"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	corev1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/klog"

	"github.com/openshift/library-go/pkg/crypto"
)

var (
	helmChartRepositoryClusterGVK = schema.GroupVersionResource{
		Group:    "helm.openshift.io",
		Version:  "v1beta1",
		Resource: "helmchartrepositories",
	}
	helmChartRepositoryNamespaceGVK = schema.GroupVersionResource{
		Group:    "helm.openshift.io",
		Version:  "v1beta1",
		Resource: "projecthelmchartrepositories",
	}
)

const (
	configNamespace = "openshift-config"
	warning         = "console-warning"
	ErrorMessage    = "The following repositories seem to be invalid or unreachable: "
)

type helmRepo struct {
	Name       string
	Namespace  string
	URL        *url.URL
	Disabled   bool
	httpClient func() (*http.Client, error)
}

func httpClient(tlsConfig *tls.Config) (*http.Client, error) {
	tr := &http.Transport{
		TLSClientConfig: tlsConfig,
		Proxy:           http.ProxyFromEnvironment,
	}

	client := &http.Client{Transport: tr}
	return client, nil
}

func (hr helmRepo) OverwrittenRepoName() string {
	if hr.Name == "openshift-helm-charts" {
		return "redhat-helm-repo"
	}
	return ""
}

func (hr helmRepo) IndexFile() (*repo.IndexFile, error) {
	var indexFile repo.IndexFile
	httpClient, err := hr.httpClient()
	if err != nil {
		return nil, err
	}
	indexURL := hr.URL.String()
	if !strings.HasSuffix(indexURL, "/index.yaml") {
		indexURL += "/index.yaml"
	}
	httpClient.Timeout = time.Duration(5 * time.Second)
	resp, err := httpClient.Get(indexURL)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		return nil, errors.New(fmt.Sprintf("Response for %v returned %v with status code %v", indexURL, resp, resp.StatusCode))
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	err = yaml.Unmarshal(body, &indexFile)
	if err != nil {
		return nil, err
	}
	for _, chartVersions := range indexFile.Entries {
		for _, chartVersion := range chartVersions {
			for i, url := range chartVersion.URLs {
				chartVersion.URLs[i], err = repo.ResolveReferenceURL(hr.URL.String(), url)
				if err != nil {
					klog.Errorf("Error resolving chart url for %v: %v", hr, err)
				}
			}
		}
	}

	return &indexFile, nil
}

type HelmRepoGetter interface {
	List(namespace string) ([]*helmRepo, error)
}

type helmRepoGetter struct {
	Client     dynamic.Interface
	CoreClient corev1.CoreV1Interface
}

func (b helmRepoGetter) unmarshallConfig(repo unstructured.Unstructured, namespace string, isClusterScoped bool) (*helmRepo, error) {
	h := &helmRepo{}
	var caReferenceNamespace, tlsRefNamespace, basicAuthRefNamespace string
	disabled, _, err := unstructured.NestedBool(repo.Object, "spec", "disabled")
	if err != nil {
		return nil, err
	}
	h.Disabled = disabled

	urlValue, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "url")
	if err != nil {
		return nil, err
	}

	h.URL, err = url.Parse(urlValue)
	if err != nil {
		return nil, err
	}

	h.Name, _, err = unstructured.NestedString(repo.Object, "metadata", "name")
	if err != nil {
		return nil, err
	}

	h.Namespace, _, err = unstructured.NestedString(repo.Object, "metadata", "namespace")
	if err != nil {
		return nil, err
	}

	caReference, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "ca", "name")
	if err != nil {
		return nil, err
	}
	if isClusterScoped {
		caReferenceNamespace = configNamespace
	} else {
		caReferenceNamespace = namespace
	}
	tlsReference, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "tlsClientConfig", "name")
	if err != nil {
		return nil, err
	}
	if isClusterScoped {
		tlsRefNamespace = configNamespace
	} else {
		tlsRefNamespace = namespace
	}

	basicAuthReference, _, err := unstructured.NestedString(repo.Object, "spec", "connectionConfig", "basicAuthConfig", "name")
	if err != nil {
		return nil, err
	}
	if isClusterScoped {
		basicAuthRefNamespace = configNamespace
	} else {
		basicAuthRefNamespace = namespace
	}

	var rootCAs *x509.CertPool
	if caReference != "" {
		configMap, err := b.CoreClient.ConfigMaps(caReferenceNamespace).Get(context.TODO(), caReference, v1.GetOptions{})
		if err != nil {
			return nil, fmt.Errorf("Failed to GET configmap %s, reason %v", caReference, err)
		}
		caBundleKey := "ca-bundle.crt"
		caCert, found := configMap.Data[caBundleKey]
		if !found {
			return nil, fmt.Errorf("Failed to find %s key in configmap %s", caBundleKey, caReference)
		}
		if caCert != "" {
			rootCAs = x509.NewCertPool()
			if ok := rootCAs.AppendCertsFromPEM([]byte(caCert)); !ok {
				return nil, fmt.Errorf("Failed to append caCert")
			}
		}
	}
	if rootCAs == nil {
		rootCAs, err = x509.SystemCertPool()
		if err != nil {
			return nil, err
		}
	}
	tlsClientConfig := crypto.SecureTLSConfig(&tls.Config{
		RootCAs: rootCAs,
	})
	if tlsReference != "" {
		secret, err := b.CoreClient.Secrets(tlsRefNamespace).Get(context.TODO(), tlsReference, v1.GetOptions{})
		if err != nil {
			return nil, fmt.Errorf("Failed to GET secret %s from %v reason %v", tlsReference, tlsRefNamespace, err)
		}
		tlsCertSecretKey := "tls.crt"
		tlsCert, ok := secret.Data[tlsCertSecretKey]
		if !ok {
			return nil, fmt.Errorf("Failed to find %s key in secret %s", tlsCertSecretKey, tlsReference)
		}
		tlsSecretKey := "tls.key"
		tlsKey, ok := secret.Data[tlsSecretKey]
		if !ok {
			return nil, fmt.Errorf("Failed to find %s key in secret %s", tlsSecretKey, tlsReference)
		}
		if tlsKey != nil && tlsCert != nil {
			cert, err := tls.X509KeyPair(tlsCert, tlsKey)
			if err != nil {
				return nil, err
			}
			tlsClientConfig.Certificates = []tls.Certificate{cert}
		}
	}

	if basicAuthReference != "" {
		secret, err := b.CoreClient.Secrets(basicAuthRefNamespace).Get(context.TODO(), basicAuthReference, v1.GetOptions{})
		if err != nil {
			return nil, fmt.Errorf("Failed to GET secret %q from %q reason %v", basicAuthReference, basicAuthRefNamespace, err)
		}
		baUsernameKey := "username"
		baPasswordKey := "password"
		baUsername, found := secret.Data[baUsernameKey]
		if !found {
			return nil, fmt.Errorf("failed to find %q key in secret '%s/%s'", baUsernameKey, basicAuthRefNamespace, basicAuthReference)
		}
		baPassword, found := secret.Data[baPasswordKey]
		if !found {
			return nil, fmt.Errorf("failed to find %q key in secret '%s/%s'", baPasswordKey, basicAuthRefNamespace, basicAuthReference)
		}
		h.URL.User = url.UserPassword(string(baUsername), string(baPassword))
	}

	h.httpClient = func() (*http.Client, error) {
		return httpClient(tlsClientConfig)
	}
	return h, nil
}

func (b *helmRepoGetter) List(namespace string) ([]*helmRepo, error) {
	var helmRepos []*helmRepo

	clusterRepos, err := b.Client.Resource(helmChartRepositoryClusterGVK).List(context.TODO(), v1.ListOptions{})
	if err != nil {
		klog.Errorf("Error listing cluster helm chart repositories: %v \nempty repository list will be used", err)
		return helmRepos, nil
	}
	for _, item := range clusterRepos.Items {
		helmConfig, err := b.unmarshallConfig(item, "", true)
		if err != nil {
			klog.Errorf("Error unmarshalling repo %v: %v", item, err)
			continue
		}
		helmRepos = append(helmRepos, helmConfig)
	}

	if namespace != "" {
		namespaceRepos, err := b.Client.Resource(helmChartRepositoryNamespaceGVK).Namespace(namespace).List(context.TODO(), v1.ListOptions{})
		if err != nil {
			klog.Errorf("Error listing namespace helm chart repositories: %v \nempty repository list will be used", err)
			return helmRepos, nil
		}
		for _, item := range namespaceRepos.Items {
			helmConfig, err := b.unmarshallConfig(item, namespace, false)
			if err != nil {
				klog.Errorf("Error unmarshalling repo %v: %v", item, err)
				continue
			}
			helmRepos = append(helmRepos, helmConfig)
		}
	}

	return helmRepos, nil
}

func NewRepoGetter(client dynamic.Interface, corev1Client corev1.CoreV1Interface) HelmRepoGetter {
	return &helmRepoGetter{
		Client:     client,
		CoreClient: corev1Client,
	}
}
