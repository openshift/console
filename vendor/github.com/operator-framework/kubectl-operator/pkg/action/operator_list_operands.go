package action

import (
	"context"
	"fmt"

	v1 "github.com/operator-framework/api/pkg/operators/v1"
	"github.com/operator-framework/api/pkg/operators/v1alpha1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// OperatorListOperands knows how to find and list custom resources given a package name and namespace.
type OperatorListOperands struct {
	config *Configuration
}

func NewOperatorListOperands(cfg *Configuration) *OperatorListOperands {
	return &OperatorListOperands{
		config: cfg,
	}
}

func (o *OperatorListOperands) Run(ctx context.Context, packageName string) (*unstructured.UnstructuredList, error) {
	opKey := types.NamespacedName{
		Name: fmt.Sprintf("%s.%s", packageName, o.config.Namespace),
	}

	result, err := o.listAll(ctx, opKey)
	if err != nil {
		return nil, err
	}

	return result, nil
}

// FindOperator finds an operator object on-cluster provided a package and namespace.
func (o *OperatorListOperands) findOperator(ctx context.Context, key types.NamespacedName) (*v1.Operator, error) {
	operator := v1.Operator{}

	err := o.config.Client.Get(ctx, key, &operator)
	if err != nil {
		if k8serrors.IsNotFound(err) {
			return nil, fmt.Errorf("package %s not found", key.Name)
		}
		return nil, err
	}
	return &operator, nil
}

// Unzip finds the CSV referenced by the provided operator and then inspects the spec.customresourcedefinitions.owned
// section of the CSV to return a list of APIs that are owned by the CSV.
func (o *OperatorListOperands) unzip(ctx context.Context, operator *v1.Operator) ([]v1alpha1.CRDDescription, error) {
	csv := v1alpha1.ClusterServiceVersion{}
	csvKey := types.NamespacedName{}

	if operator.Status.Components == nil {
		return nil, fmt.Errorf("could not find underlying components for operator %s", operator.Name)
	}
	for _, resource := range operator.Status.Components.Refs {
		if resource.Kind == v1alpha1.ClusterServiceVersionKind {
			csvKey.Name = resource.Name
			csvKey.Namespace = resource.Namespace
			break
		}
	}

	if csvKey.Name == "" && csvKey.Namespace == "" {
		return nil, fmt.Errorf("could not find underlying CSV for operator %s", operator.Name)
	}

	err := o.config.Client.Get(ctx, csvKey, &csv)
	if err != nil {
		return nil, fmt.Errorf("could not get %s CSV on cluster: %s", csvKey.String(), err)
	}

	// check if owned CRDs are defined on the csv
	if len(csv.Spec.CustomResourceDefinitions.Owned) == 0 {
		return nil, fmt.Errorf("no owned CustomResourceDefinitions specified on CSV %s, no custom resources to display", csvKey.String())
	}

	// check CSV is not in a failed state (to ensure some OLM multitenancy rules are not violated)
	if csv.Status.Phase != v1alpha1.CSVPhaseSucceeded {
		return nil, fmt.Errorf("CSV underlying operator is not in a succeeded state: custom resource list may not be accurate")
	}

	return csv.Spec.CustomResourceDefinitions.Owned, nil
}

// List takes in a CRD description and finds the associated CRs on-cluster.
// List can return a potentially unbounded list that callers may need to paginate.
func (o *OperatorListOperands) list(ctx context.Context, crdDesc v1alpha1.CRDDescription, namespaces []string) (*unstructured.UnstructuredList, error) {
	result := &unstructured.UnstructuredList{}

	// get crd group from crd name
	crd := apiextensionsv1.CustomResourceDefinition{}
	crdKey := types.NamespacedName{
		Name: crdDesc.Name,
	}
	err := o.config.Client.Get(ctx, crdKey, &crd)
	if err != nil {
		return nil, fmt.Errorf("get crd %q: %v", crdKey.String(), err)
	}

	list := unstructured.UnstructuredList{}
	gvk := schema.GroupVersionKind{
		Group:   crd.Spec.Group,
		Version: crdDesc.Version,
		Kind:    crd.Spec.Names.ListKind,
	}
	list.SetGroupVersionKind(gvk)
	if err := o.config.Client.List(ctx, &list); err != nil {
		return nil, err
	}

	// trim down CRs in list to match target namespaces
	if len(namespaces) == 0 {
		return &list, nil
	}
	for _, cr := range list.Items {
		if cr.GetNamespace() == "" || inNamespace(cr.GetNamespace(), namespaces) {
			result.Items = append(result.Items, cr)
		}
	}

	return result, nil
}

// ListAll wraps the above functions to provide a convenient command to go from package/namespace to custom resources.
func (o *OperatorListOperands) listAll(ctx context.Context, opKey types.NamespacedName) (*unstructured.UnstructuredList, error) {
	operator, err := o.findOperator(ctx, opKey)
	if err != nil {
		return nil, err
	}

	crdDescs, err := o.unzip(ctx, operator)
	if err != nil {
		return nil, err
	}

	// find all namespaces associated with operator via operatorgroup
	// query for CRs in these namespaces
	ogList := v1.OperatorGroupList{}
	options := client.ListOptions{Namespace: o.config.Namespace}
	if err := o.config.Client.List(ctx, &ogList, &options); err != nil {
		return nil, err
	}
	if len(ogList.Items) != 1 {
		return nil, fmt.Errorf("unexpected number (%d) of operator groups found in namespace %s", len(ogList.Items), o.config.Namespace)
	}
	namespaces := ogList.Items[0].Status.Namespaces

	var result unstructured.UnstructuredList
	result.SetGroupVersionKind(schema.GroupVersionKind{
		Version: "v1",
		Kind:    "List",
	})
	for _, crd := range crdDescs {
		list, err := o.list(ctx, crd, namespaces)
		if err != nil {
			return nil, err
		}
		result.Items = append(result.Items, list.Items...)
	}
	return &result, nil
}

func inNamespace(ns string, namespaces []string) bool {
	for _, n := range namespaces {
		if n == ns || n == "" {
			return true
		}
	}
	return false
}
