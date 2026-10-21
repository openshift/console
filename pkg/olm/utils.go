package olm

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/openshift/console/pkg/auth"
	"github.com/operator-framework/kubectl-operator/pkg/action"
	"github.com/operator-framework/operator-registry/alpha/declcfg"
	"github.com/operator-framework/operator-registry/alpha/property"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func (o *OLMHandler) getOperatorMeta(r *http.Request) (string, string, error) {
	query := r.URL.Query()
	operatorName := query.Get("name")
	operatorNamespace := query.Get("namespace")
	if len(operatorName) < 1 || len(operatorNamespace) < 1 {
		return "", "", fmt.Errorf("failed to get operator name or namespace from the request URL: %q", r.URL.String())
	}
	return operatorName, operatorNamespace, nil
}

func (o *OLMHandler) getK8sClientConfig(r *http.Request) (*rest.Config, error) {
	user := auth.GetUserFromRequestContext(r)
	if user == nil {
		return nil, fmt.Errorf("failed to get user from request context")
	}

	config := &rest.Config{
		Host:        o.apiServerURL,
		Transport:   o.client.Transport,
		BearerToken: user.Token,
	}

	return config, nil
}

func (o *OLMHandler) getClientWithScheme(r *http.Request) (client.Client, *runtime.Scheme, error) {
	scheme, err := action.NewScheme()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get new scheme for olm client: %v", err)
	}
	config, err := o.getK8sClientConfig(r)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get new config for olm client: %v", err)
	}
	client, err := client.New(config, client.Options{
		Scheme: scheme,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get new olm client: %v", err)
	}
	return client, scheme, nil
}

func deduplicateUnstructuredList(list []unstructured.Unstructured) []unstructured.Unstructured {
	seen := make(map[string]bool)
	uniqueItems := make([]unstructured.Unstructured, 0, len(list))

	for _, item := range list {
		uid := string(item.GetUID())
		if !seen[uid] {
			seen[uid] = true
			uniqueItems = append(uniqueItems, item)
		}
	}

	return uniqueItems
}

func getBundleVersion(bundle *declcfg.Bundle) (string, error) {
	for _, prop := range bundle.Properties {
		if prop.Type == "olm.package" {
			var pkg property.Package
			if err := json.Unmarshal(prop.Value, &pkg); err != nil {
				return "", fmt.Errorf("failed to unmarshal package property for bundle %q: %w", bundle.Name, err)
			}
			return pkg.Version, nil
		}
	}
	return "", fmt.Errorf("no olm.package property found for bundle %q", bundle.Name)
}
