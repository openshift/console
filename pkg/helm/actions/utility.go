package actions

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"strings"
	"unicode"

	"github.com/openshift/api/helm/v1beta1"
	"github.com/openshift/console/pkg/helm/chartproxy"
	kv1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/dynamic"
	corev1client "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/klog"
)

type Secret struct {
	SecretName string `json:"secret_name"`
}

// constants
const (
	configNamespace         = "openshift-config"
	tlsSecretCertKey        = "tls.crt"
	tlsSecretKey            = "tls.key"
	caBundleKey             = "ca-bundle.crt"
	tlsSecretPattern        = "tlscrt-*"
	tlsKeyPattern           = "tlskey-*"
	cacertPattern           = "cacert-*"
	username                = "username"
	password                = "password"
	openshiftRepoUrl        = "https://charts.openshift.io"
	chartRepoPrefix         = "chart.openshift.io/chart-url-prefix"
	openshiftChartUrlPrefix = "https://github.com/openshift-helm-charts/"
)

type ChartInfo struct {
	Name                string
	Version             string
	RepositoryName      string
	RepositoryNamespace string
}

func findChartVersion(chartValue string) string {
	for i := 1; i < len(chartValue); i++ {
		if unicode.IsDigit(rune(chartValue[i])) && chartValue[i-1] == byte('-') {
			start := i
			var end int
			for j := i; j < len(chartValue)-1; j++ {
				if unicode.IsDigit(rune(chartValue[j])) == false && unicode.IsDigit(rune(chartValue[j+1])) == false {
					end = j - 2
				}
			}
			return chartValue[start:end]
		}
	}
	return ""
}

func getChartInfoFromIndexEntry(
	indexEntry, namespace, url string) *ChartInfo {
	indexArr := strings.Split(indexEntry, "--")
	pathsOfUrl := strings.Split(url, "/")
	version := findChartVersion(pathsOfUrl[len(pathsOfUrl)-1])
	return &ChartInfo{
		RepositoryName:      indexArr[1],
		RepositoryNamespace: namespace,
		Name:                indexArr[0],
		Version:             version,
	}
}

// writeTempFile creates a temporary file with the given `data`. `pattern`
// is used by `os.CreateTemp` to create a file in the filesystem.
func writeTempFile(data []byte, pattern string) (*os.File, error) {
	f, createErr := os.CreateTemp("", pattern)
	if createErr != nil {
		return nil, createErr
	}

	_, writeErr := f.Write(data)
	if writeErr != nil {
		return nil, writeErr
	}

	closeErr := f.Close()
	if closeErr != nil {
		return nil, closeErr
	}

	return f, nil
}

// getChartInfoFromChartUrl returns information for the chart contained in
// the given `url`.
//
// This function works by listing all available Helm Chart repositories (either
// scoped by the given `namespace` or cluster scoped), then comparing URLs of
// all existing charts in the repository manifest to match the given `chartUrl`.
func getChartInfoFromChartUrl(
	chartUrl string,
	namespace string,
	client dynamic.Interface,
	coreClient corev1client.CoreV1Interface,
) (*ChartInfo, error) {
	repositories, err := chartproxy.NewRepoGetter(client, coreClient).List(namespace)
	if err != nil {
		return nil, fmt.Errorf("error listing repositories: %v", err)
	}

	for _, repository := range repositories {
		idx, err := repository.IndexFile()
		if err != nil {
			return nil, fmt.Errorf("error producing the index file of repository %q in namespace %q is %q", repository.Name, repository.Namespace, err.Error())
		}
		for chartIndex, chartVersions := range idx.Entries {
			for _, chartVersion := range chartVersions {
				for _, url := range chartVersion.URLs {
					if chartUrl == url {
						return &ChartInfo{
							RepositoryName:      repository.Name,
							RepositoryNamespace: repository.Namespace,
							Name:                chartIndex,
							Version:             chartVersion.Version,
						}, nil
					}
				}
			}
		}
	}
	return nil, fmt.Errorf("could not find a repository for the chart url %q in namespace %q", chartUrl, namespace)
}

// getRepositoryConnectionConfig returns the connection configuration for the
// repository with given `name` and `namespace`.
func getRepositoryConnectionConfig(
	name string,
	namespace string,
	client dynamic.Interface,
) (interface{}, bool, error) {
	// attempt to get a project scoped Helm Chart repository
	unstructuredRepository, getProjectRepositoryErr := client.Resource(helmChartRepositoryNamespaceGVK).Namespace(namespace).Get(context.TODO(), name, v1.GetOptions{})
	if getProjectRepositoryErr == nil {
		var repository v1beta1.ProjectHelmChartRepository
		err := runtime.DefaultUnstructuredConverter.FromUnstructured(unstructuredRepository.Object, &repository)
		if err != nil {
			return v1beta1.ConnectionConfig{}, false, err
		}
		//return false for icClusterScoped Repo or not
		return repository.Spec.ProjectConnectionConfig, false, nil
	}

	// attempt to get a cluster scoped Helm Chart repository
	unstructuredRepository, getClusterRepositoryErr := client.Resource(helmChartRepositoryClusterGVK).Get(context.TODO(), name, v1.GetOptions{})
	if getClusterRepositoryErr == nil {
		var repository v1beta1.HelmChartRepository
		err := runtime.DefaultUnstructuredConverter.FromUnstructured(unstructuredRepository.Object, &repository)
		if err != nil {
			return v1beta1.ConnectionConfig{}, false, err
		}
		return repository.Spec.ConnectionConfig, true, nil
	}

	// neither project or cluster scoped Helm Chart repositories have been found.
	klog.Errorf("Error listing namespace helm chart repositories: %v \nempty repository list will be used", getClusterRepositoryErr)
	return v1beta1.ConnectionConfig{}, false, getClusterRepositoryErr
}

func getSecret(ns string, name string, version int, coreclient corev1client.CoreV1Interface) (Secret, error) {
	label := fmt.Sprintf("owner=helm,name=%v,version=%v", name, version)
	timeout := int64(60)
	secretList, err := coreclient.Secrets(ns).Watch(context.TODO(), metav1.ListOptions{LabelSelector: label, Watch: true, TimeoutSeconds: &timeout})
	if err != nil {
		return Secret{}, err
	}
	event := <-secretList.ResultChan()
	if event.Object != nil {
		obj := event.Object.(*kv1.Secret)
		//check if secret exist with a field called as error
		actionError, found := obj.Data["error"]
		if found {
			secretList.Stop()
			//Delete secret created to track errors on installation
			coreclient.Secrets(ns).Delete(context.TODO(), name, v1.DeleteOptions{})
			return Secret{}, fmt.Errorf(string(actionError))
		} else {
			secretList.Stop()
			return Secret{
				SecretName: obj.ObjectMeta.Name,
			}, nil
		}
	}
	return Secret{}, fmt.Errorf("release secret not found")
}

func createSecret(ns string, name string, version int, coreclient corev1client.CoreV1Interface, err error) error {
	data := map[string][]byte{
		"error": []byte(err.Error()),
	}
	secretLabels := make(map[string]string, 0)
	secretLabels["owner"] = "helm"
	secretLabels["name"] = name
	secretLabels["version"] = strconv.Itoa(version)
	secretSpec := &kv1.Secret{Data: data, ObjectMeta: metav1.ObjectMeta{Name: name, Namespace: ns, Labels: secretLabels}}
	_, err = coreclient.Secrets(ns).Create(context.TODO(), secretSpec, v1.CreateOptions{})
	if err != nil {
		return err
	}
	return nil
}
