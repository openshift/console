package olm

import (
	"context"
	"slices"
	"strings"
	"sync"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// The library collects objects by CSV ownership labels with cluster-wide lists.
// Enumerate delegated namespaces instead of granting cluster-wide Secret reads.
type migrationCollectionClient struct {
	client.Client
	namespaces []string
	expected   map[string][]schema.GroupResource
	mu         sync.Mutex
	err        error
}

// collectionError preserves errors the library's optional resource collectors may ignore.
func (c *migrationCollectionClient) collectionError() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.err
}

// listResources fails closed when a delegated collection grant is lost or its API becomes unavailable.
func (c *migrationCollectionClient) listResources(ctx context.Context, objects *unstructured.UnstructuredList, resource schema.GroupResource, namespace string, options ...client.ListOption) error {
	err := c.Client.List(ctx, objects, options...)
	if err == nil {
		return nil
	}
	// Older journals do not record their grants. Refuse to infer that a denied
	// collection was intentionally excluded from those jobs.
	expected := c.expected == nil || slices.Contains(c.expected[namespace], resource) || slices.Contains(c.expected[""], resource)
	if expected {
		// A preceding batch item may have deleted its source namespace after
		// successful cross-namespace migration. There is nothing left to collect.
		if namespace != "" && (apierrors.IsForbidden(err) || apierrors.IsNotFound(err)) {
			var ns corev1.Namespace
			if apierrors.IsNotFound(c.Client.Get(ctx, client.ObjectKey{Name: namespace}, &ns)) {
				return nil
			}
		}
		c.mu.Lock()
		if c.err == nil {
			c.err = err
		}
		c.mu.Unlock()
	} else if apierrors.IsForbidden(err) {
		return nil
	}
	return err
}

// List scopes namespaced collection and distinguishes intentionally absent grants from unexpected authorization failures.
func (c *migrationCollectionClient) List(ctx context.Context, list client.ObjectList, options ...client.ListOption) error {
	objects, ok := list.(*unstructured.UnstructuredList)
	if !ok {
		return c.Client.List(ctx, list, options...)
	}
	gvk := objects.GroupVersionKind()
	mapping, err := c.RESTMapper().RESTMapping(schema.GroupKind{Group: gvk.Group, Kind: strings.TrimSuffix(gvk.Kind, "List")}, gvk.Version)
	if err != nil {
		return err
	}
	resource := mapping.Resource.GroupResource()
	namespace := (&client.ListOptions{}).ApplyOptions(options).Namespace
	if mapping.Scope.Name() != meta.RESTScopeNameNamespace || namespace != "" {
		return c.listResources(ctx, objects, resource, namespace, options...)
	}
	objects.Items = nil
	for _, namespace := range c.namespaces {
		var selected unstructured.UnstructuredList
		selected.SetGroupVersionKind(gvk)
		scoped := append(append([]client.ListOption(nil), options...), client.InNamespace(namespace))
		if err := c.listResources(ctx, &selected, resource, namespace, scoped...); err != nil {
			return err
		}
		objects.Items = append(objects.Items, selected.Items...)
	}
	return nil
}
