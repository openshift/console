package fake

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/dynamic/fake"
)

func newUnstructured(apiVersion, kind, namespace, name string) *unstructured.Unstructured {
	return &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": apiVersion,
			"kind":       kind,
			"metadata": map[string]interface{}{
				"namespace": namespace,
				"name":      name,
			},
		},
	}
}

func newScheme() *runtime.Scheme {
	scheme := runtime.NewScheme()
	scheme.AddKnownTypeWithName(schema.GroupVersionKind{Group: "helm.openshift.io", Version: "v1beta1", Kind: "HelmChartRepositoryList"}, &unstructured.UnstructuredList{})
	scheme.AddKnownTypeWithName(schema.GroupVersionKind{Group: "helm.openshift.io", Version: "v1beta1", Kind: "ProjectHelmChartRepositoryList"}, &unstructured.UnstructuredList{})
	return scheme
}

func fakeHelmCR(apiVersion, kind, ns, name, fakeIndexFile string) *unstructured.Unstructured {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/yaml")
		fmt.Fprintln(w, fakeIndexFile)
	}))
	sampleRepoCR := newUnstructured(apiVersion, kind, ns, name)
	connectionConfig := map[string]interface{}{
		"url": ts.URL,
	}
	sampleRepoCR.Object["spec"] = map[string]interface{}{
		"connectionConfig": connectionConfig,
		"name":             name,
	}
	return sampleRepoCR
}

func K8sDynamicClient(apiVersion, kind, ns string, indexFiles ...string) dynamic.Interface {
	var objs []runtime.Object

	for i, indexFile := range indexFiles {
		fakeCr := fakeHelmCR(apiVersion, kind, ns, "sample-repo-"+strconv.Itoa(i+1), indexFile)
		objs = append(objs, fakeCr)
	}

	return fake.NewSimpleDynamicClient(newScheme(), objs...)
}

func K8sDynamicClientMultipleNamespace(ns string, indexFilesCluster []string, indexFilesNamespace []string) dynamic.Interface {
	var objs []runtime.Object

	for i, indexFile := range indexFilesCluster {
		fakeCr := fakeHelmCR("helm.openshift.io/v1beta1", "HelmChartRepository", "", "sample-cluster-repo-"+strconv.Itoa(i+1), indexFile)
		objs = append(objs, fakeCr)
	}

	for i, indexFile := range indexFilesNamespace {
		fakeCr := fakeHelmCR("helm.openshift.io/v1beta1", "ProjectHelmChartRepository", ns, "sample-namespace-repo-"+strconv.Itoa(i+1), indexFile)
		objs = append(objs, fakeCr)
	}

	return fake.NewSimpleDynamicClient(newScheme(), objs...)
}

func K8sDynamicClientWithRepoNames(apiVersion, kind, ns string, repoNames []string, indexFiles ...string) dynamic.Interface {
	var objs []runtime.Object

	for i, indexFile := range indexFiles {
		fakeCr := fakeHelmCR(apiVersion, kind, ns, repoNames[i], indexFile)
		objs = append(objs, fakeCr)
	}

	return fake.NewSimpleDynamicClient(newScheme(), objs...)
}

func K8sDynamicClientFromCRs(crs ...*unstructured.Unstructured) dynamic.Interface {
	var objs []runtime.Object

	for _, cr := range crs {
		objs = append(objs, cr)
	}

	return fake.NewSimpleDynamicClient(newScheme(), objs...)
}
