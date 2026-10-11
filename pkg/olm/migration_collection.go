package olm

import (
	"context"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// The library collects objects by CSV ownership labels with cluster-wide lists.
// Enumerate authorized namespaces instead of delegating a cluster-wide Secret
// reader. Cluster-scoped resources and explicit namespace queries are unchanged.
type migrationCollectionClient struct {
	client.Client
	namespaces []string
}

func (c *migrationCollectionClient) List(ctx context.Context, list client.ObjectList, options ...client.ListOption) error {
	objects, ok := list.(*unstructured.UnstructuredList)
	if !ok || (&client.ListOptions{}).ApplyOptions(options).Namespace != "" {
		return c.Client.List(ctx, list, options...)
	}
	gvk := objects.GroupVersionKind()
	mapping, err := c.RESTMapper().RESTMapping(schema.GroupKind{Group: gvk.Group, Kind: strings.TrimSuffix(gvk.Kind, "List")}, gvk.Version)
	if err != nil {
		return err
	}
	if mapping.Scope.Name() != meta.RESTScopeNameNamespace {
		return c.Client.List(ctx, list, options...)
	}
	objects.Items = nil
	for _, namespace := range c.namespaces {
		var selected unstructured.UnstructuredList
		selected.SetGroupVersionKind(gvk)
		scoped := append(append([]client.ListOption(nil), options...), client.InNamespace(namespace))
		if err := c.Client.List(ctx, &selected, scoped...); err != nil {
			// A namespace may have grants for only some of the collected kinds.
			if apierrors.IsForbidden(err) {
				continue
			}
			return err
		}
		objects.Items = append(objects.Items, selected.Items...)
	}
	return nil
}
