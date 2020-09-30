package fake

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strconv"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
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

func fakeHelmCR(fakeIndexFile string, name string) *unstructured.Unstructured {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/yaml")
		fmt.Fprintln(w, fakeIndexFile)
	}))
	sampleRepoCR := newUnstructured("helm.openshift.io/v1beta1", "HelmChartRepository", "", name)
	connectionConfig := map[string]interface{}{
		"url": ts.URL,
	}
	sampleRepoCR.Object["spec"] = map[string]interface{}{
		"connectionConfig": connectionConfig,
		"name":             name,
	}
	return sampleRepoCR
}

func K8sDynamicClient(indexFiles ...string) dynamic.Interface {
	scheme := runtime.NewScheme()
	var objs []runtime.Object

	for i, indexFile := range indexFiles {
		fakeCr := fakeHelmCR(indexFile, "sample-repo-"+strconv.Itoa(i+1))
		objs = append(objs, fakeCr)
	}

	return fake.NewSimpleDynamicClient(scheme, objs...)
}

func K8sDynamicClientFromCRs(crs ...*unstructured.Unstructured) dynamic.Interface {
	scheme := runtime.NewScheme()
	var objs []runtime.Object

	for _, cr := range crs {
		objs = append(objs, cr)
	}

	return fake.NewSimpleDynamicClient(scheme, objs...)
}
