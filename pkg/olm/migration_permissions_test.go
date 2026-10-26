package olm

import (
	"context"
	"errors"
	"slices"
	"testing"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

// TestMigrationDelegatedCrossNamespaceScale enforces generated RBAC while the library stops source Deployments and inspects their ReplicaSets.
func TestMigrationDelegatedCrossNamespaceScale(t *testing.T) {
	ctx := context.Background()
	replicas := int32(1)
	deployment := &appsv1.Deployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "source", UID: "deployment-uid", Labels: map[string]string{"olm.owner": "demo.v1"}}, Spec: appsv1.DeploymentSpec{Replicas: &replicas}}
	kubeClient := newMigrationTestClient(t,
		deployment,
		&appsv1.ReplicaSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-revision", Namespace: "source", OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(deployment, appsv1.SchemeGroupVersion.WithKind("Deployment"))}}},
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "source"}},
		&operatorsv1alpha1.Subscription{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "source"}, Spec: &operatorsv1alpha1.SubscriptionSpec{Package: "demo", CatalogSource: "source", CatalogSourceNamespace: "catalog"}, Status: operatorsv1alpha1.SubscriptionStatus{InstalledCSV: "demo.v1"}},
		&operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "source"}},
		&operatorsv1alpha1.CatalogSource{ObjectMeta: metav1.ObjectMeta{Name: "source", Namespace: "catalog"}, Spec: operatorsv1alpha1.CatalogSourceSpec{SourceType: operatorsv1alpha1.SourceTypeGrpc, Image: "example.test/catalog:fixture"}},
		&apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}},
	)
	kubeClient.RESTMapper().(*meta.DefaultRESTMapper).Add(appsv1.SchemeGroupVersion.WithKind("Deployment"), meta.RESTScopeNamespace)
	request := operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "demo", SubscriptionNamespace: "source", InstallNamespace: "target"}}}
	permissions, err := prepareMigrationExecutionPermissions(ctx, migration.NewMigrator(kubeClient, nil), request, "job")
	require.NoError(t, err)
	collection := migrationCollectionPermissions(permissions, "job", []string{"source", "target", "catalog", "operator-controller"})
	assert.Contains(t, collection["source"], schema.GroupResource{Group: "apps", Resource: "replicasets"})
	assert.Contains(t, collection["source"], schema.GroupResource{Resource: "secrets"})
	assert.NotContains(t, collection["target"], schema.GroupResource{Group: "apps", Resource: "replicasets"})
	assert.NotContains(t, collection[""], schema.GroupResource{Group: "apps", Resource: "replicasets"})
	var rules []rbacv1.PolicyRule
	for _, object := range permissions {
		switch role := object.(type) {
		case *rbacv1.Role:
			if role.Namespace == "source" {
				rules = append(rules, role.Rules...)
			}
		case *rbacv1.ClusterRole:
			rules = append(rules, role.Rules...)
		}
	}
	manifest, err := runtime.DefaultUnstructuredConverter.ToUnstructured(deployment)
	require.NoError(t, err)
	source := unstructured.Unstructured{Object: manifest}
	source.SetAPIVersion("apps/v1")
	source.SetKind("Deployment")
	for _, delegateReplicaSets := range []bool{false, true} {
		t.Run(map[bool]string{false: "missing ReplicaSet grant", true: "delegated cutover"}[delegateReplicaSets], func(t *testing.T) {
			authorize := func(group, resource, verb, name string) error {
				for _, rule := range rules {
					if !delegateReplicaSets && resource == "replicasets" {
						continue
					}
					if slices.Contains(rule.APIGroups, group) && slices.Contains(rule.Resources, resource) && slices.Contains(rule.Verbs, verb) && (len(rule.ResourceNames) == 0 || slices.Contains(rule.ResourceNames, name)) {
						return nil
					}
				}
				return apierrors.NewForbidden(schema.GroupResource{Group: group, Resource: resource}, name, errors.New("not delegated"))
			}
			listedReplicaSets := false
			executionClient := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
				Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, opts ...client.GetOption) error {
					if err := authorize("apps", "deployments", "get", key.Name); err != nil {
						return err
					}
					return cl.Get(ctx, key, object, opts...)
				},
				Update: func(ctx context.Context, cl client.WithWatch, object client.Object, opts ...client.UpdateOption) error {
					if err := authorize("apps", "deployments", "update", object.GetName()); err != nil {
						return err
					}
					return cl.Update(ctx, object, opts...)
				},
				List: func(ctx context.Context, cl client.WithWatch, list client.ObjectList, opts ...client.ListOption) error {
					assert.Equal(t, "source", (&client.ListOptions{}).ApplyOptions(opts).Namespace)
					group, resource := "", "pods"
					if _, ok := list.(*appsv1.ReplicaSetList); ok {
						group, resource, listedReplicaSets = "apps", "replicasets", true
					}
					if err := authorize(group, resource, "list", ""); err != nil {
						return err
					}
					return cl.List(ctx, list, opts...)
				},
			})
			restore, err := migration.NewMigrator(executionClient, nil).ScaleSourceDeployments(ctx, []unstructured.Unstructured{source}, request.Operators[0].options())
			require.True(t, listedReplicaSets)
			if delegateReplicaSets {
				require.NoError(t, err)
				require.NoError(t, restore(ctx))
			} else {
				require.True(t, apierrors.IsForbidden(err), "%v", err)
			}
			var restored appsv1.Deployment
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(deployment), &restored))
			assert.Equal(t, int32(1), *restored.Spec.Replicas)
		})
	}
}
