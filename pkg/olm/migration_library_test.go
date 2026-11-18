package olm

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	corev1 "k8s.io/api/core/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

// TestLibraryPreparationKeepsSourceUIDPreconditions verifies library deletion retains the journal's source identity and orphan propagation.
func TestLibraryPreparationKeepsSourceUIDPreconditions(t *testing.T) {
	for _, tt := range []struct {
		name                    string
		subscriptionUID, csvUID types.UID
		conflict                bool
	}{
		{name: "original source", subscriptionUID: "original-subscription", csvUID: "original-csv"},
		{name: "replaced Subscription", subscriptionUID: "replacement-subscription", csvUID: "original-csv", conflict: true},
		{name: "replaced CSV", subscriptionUID: "original-subscription", csvUID: "replacement-csv", conflict: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			sub := &operatorsv1alpha1.Subscription{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators", UID: tt.subscriptionUID}}
			csv := &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators", UID: tt.csvUID}}
			backup := migration.Backup{Subscription: sub.DeepCopy(), ClusterServiceVersion: csv.DeepCopy()}
			backup.Subscription.UID, backup.ClusterServiceVersion.UID = "original-subscription", "original-csv"
			kubeClient := newMigrationTestClient(t, sub, csv)
			id := "0123456789abcdef0123456789abcdef"
			namespace, _ := migrationJobNamespace(id)
			c := &migrationCoordinator{client: kubeClient, identity: "backend"}
			_, err := c.claim(ctx, namespace)
			require.NoError(t, err)
			opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", InstallNamespace: "operators", ClusterExtensionName: "demo"}
			journal := &migrationJournal{JobID: id, Phase: "prepare", Options: opts, Backup: backup}
			require.NoError(t, c.saveJournal(ctx, namespace, journal))
			prepared := errors.New("stop after preparation")
			deletes := 0
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
				Delete: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.DeleteOption) error {
					deletes++
					deletion := (&client.DeleteOptions{}).ApplyOptions(options)
					require.NotNil(t, deletion.Preconditions)
					require.NotNil(t, deletion.Preconditions.UID)
					assert.Equal(t, metav1.DeletePropagationOrphan, *deletion.PropagationPolicy)
					if _, subscription := object.(*operatorsv1alpha1.Subscription); subscription {
						assert.Equal(t, types.UID("original-subscription"), *deletion.Preconditions.UID)
					} else {
						assert.Equal(t, types.UID("original-csv"), *deletion.Preconditions.UID)
					}
					// controller-runtime's fake client does not enforce UID
					// preconditions, so reproduce the API server's conflict here.
					live := object.DeepCopyObject().(client.Object)
					if err := cl.Get(ctx, client.ObjectKeyFromObject(object), live); err != nil {
						return err
					}
					if live.GetUID() != *deletion.Preconditions.UID {
						return apierrors.NewConflict(schema.GroupResource{Resource: "source"}, object.GetName(), errors.New("UID changed"))
					}
					return cl.Delete(ctx, object, options...)
				},
				Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
					if _, target := object.(*ocv1.ClusterObjectSet); target {
						return prepared
					}
					return cl.Get(ctx, key, object, options...)
				},
			})
			guard := &migrationExecutionClient{Client: runner, coordinator: c, namespace: namespace, id: id, sourceSubscription: backup.Subscription}
			err = c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal)
			if tt.conflict {
				require.True(t, apierrors.IsConflict(err), "%v", err)
				if tt.subscriptionUID != "original-subscription" {
					require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(sub), &operatorsv1alpha1.Subscription{}))
				}
				if tt.csvUID != "original-csv" {
					require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(csv), &operatorsv1alpha1.ClusterServiceVersion{}))
				}
			} else {
				require.ErrorIs(t, err, prepared)
				assert.Equal(t, 2, deletes)
				assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(sub), &operatorsv1alpha1.Subscription{})))
				assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(csv), &operatorsv1alpha1.ClusterServiceVersion{})))
			}
		})
	}
}

// TestLibraryRendersPersistedManifestsWithoutOldOwnership verifies the library API cleans handoff data even when old journals retain stale metadata.
func TestLibraryRendersPersistedManifestsWithoutOldOwnership(t *testing.T) {
	object := unstructured.Unstructured{Object: map[string]interface{}{"apiVersion": "v1", "kind": "ServiceAccount", "metadata": map[string]interface{}{
		"name": "demo", "namespace": "operators",
		"annotations": map[string]interface{}{migrationResourceRevisionAnnotation: "2", "customer": "preserved"},
		"labels":      map[string]interface{}{"boxcutter-managed": "true", "app.kubernetes.io/managed-by": "olm.operatorframework.io", "customer": "preserved"},
	}}}
	info := &migration.MigrationInfo{CollectedObjects: []unstructured.Unstructured{object}}
	interrupted := errors.New("stop before handoff")
	var manifests []unstructured.Unstructured
	crd := &apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}}
	runner := interceptor.NewClient(newMigrationTestClient(t, crd).(client.WithWatch), interceptor.Funcs{Create: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.CreateOption) error {
		if _, target := object.(*ocv1.ClusterObjectSet); target {
			return interrupted
		}
		if secret, ok := object.(*corev1.Secret); ok && secret.Type == corev1.SecretType(migration.SecretTypeObjectData) {
			for _, data := range secret.Data {
				var manifest unstructured.Unstructured
				require.NoError(t, json.Unmarshal(data, &manifest))
				manifests = append(manifests, manifest)
			}
		}
		return cl.Create(ctx, object, options...)
	}})
	err := migration.NewMigrator(runner, nil).CreateClusterObjectSet(context.Background(), migration.Options{ClusterExtensionName: "demo", SystemNamespace: "system"}, info)
	require.ErrorIs(t, err, interrupted)
	require.Len(t, manifests, 1)
	assert.NotContains(t, manifests[0].GetAnnotations(), migrationResourceRevisionAnnotation)
	assert.NotContains(t, manifests[0].GetLabels(), "boxcutter-managed")
	assert.NotContains(t, manifests[0].GetLabels(), "app.kubernetes.io/managed-by")
	assert.Equal(t, "preserved", manifests[0].GetAnnotations()["customer"])
	assert.Equal(t, "preserved", manifests[0].GetLabels()["customer"])
	assert.Equal(t, "2", info.CollectedObjects[0].GetAnnotations()[migrationResourceRevisionAnnotation])
}

// TestMigrationRequiresDurableExecutor prevents the job runner from falling back to nonresumable library execution.
func TestMigrationRequiresDurableExecutor(t *testing.T) {
	store := newMigrationJobStore()
	job, err := store.create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "demo", SubscriptionNamespace: "operators"}}})
	require.NoError(t, err)
	handler := &OLMHandler{migrationJobs: store, migrationResumeCandidate: func(operatorMigrationOptionsRequest) (bool, error) { return true, nil }}
	handler.runMigrationJob(job.ID, migration.NewMigrator(newMigrationTestClient(t), nil))
	result, _ := store.snapshotForRunner(job.ID)
	assert.Equal(t, "CompletedWithErrors", result.Status)
	require.Len(t, result.Items, 1)
	assert.Equal(t, "Failed", result.Items[0].Status)
	assert.Equal(t, "durable migration executor is not configured", result.Items[0].Error)
}

// TestLibraryClusterObjectSetUsesExtensionGroup verifies library-created revisions join the target extension's group, including after a lost create response.
func TestLibraryClusterObjectSetUsesExtensionGroup(t *testing.T) {
	for _, lostResponse := range []bool{false, true} {
		name := "created"
		if lostResponse {
			name = "lost response"
		}
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()
			crd := &apiextensionsv1.CustomResourceDefinition{
				ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"},
				Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{
					Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue,
				}}},
			}
			kubeClient := newMigrationTestClient(t, crd)
			id := "0123456789abcdef0123456789abcdef"
			namespace, _ := migrationJobNamespace(id)
			coordinator := &migrationCoordinator{client: kubeClient, identity: "backend"}
			claimed, err := coordinator.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			revisionClient := newMigrationRevisionAPIClient(t, kubeClient)
			created := false
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
				Create: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.CreateOption) error {
					if object.GetObjectKind().GroupVersionKind().Kind != ocv1.ClusterObjectSetKind {
						if _, ok := object.(*ocv1.ClusterObjectSet); !ok {
							return cl.Create(ctx, object, options...)
						}
					}
					created = true
					if err := revisionClient.Create(ctx, object, options...); err != nil {
						return err
					}
					if lostResponse {
						return errors.New("create response lost")
					}
					return nil
				},
				Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
					if object.GetObjectKind().GroupVersionKind().Kind == ocv1.ClusterObjectSetKind {
						return revisionClient.Get(ctx, key, object, options...)
					}
					if _, ok := object.(*ocv1.ClusterObjectSet); ok {
						return revisionClient.Get(ctx, key, object, options...)
					}
					return cl.Get(ctx, key, object, options...)
				},
				Update: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.UpdateOption) error {
					return revisionClient.Update(ctx, object, options...)
				},
			})
			guard := &migrationExecutionClient{Client: runner, coordinator: coordinator, namespace: namespace, id: id}
			err = migration.NewMigrator(guard, nil).CreateClusterObjectSet(ctx, migration.Options{
				SubscriptionName: "source-subscription", SubscriptionNamespace: "operators",
				ClusterExtensionName: "target-extension", SystemNamespace: "system",
			}, &migration.MigrationInfo{})
			require.NoError(t, err)
			require.True(t, created)
			var revision ocv1.ClusterObjectSet
			require.NoError(t, guard.Get(ctx, client.ObjectKey{Name: "target-extension-1"}, &revision))
			raw := &unstructured.Unstructured{}
			raw.SetGroupVersionKind(ocv1.GroupVersion.WithKind(ocv1.ClusterObjectSetKind))
			require.NoError(t, revisionClient.Get(ctx, client.ObjectKeyFromObject(&revision), raw))
			assert.Equal(t, "target-extension", raw.Object["spec"].(map[string]interface{})["group"])
			assert.Equal(t, id, revision.Annotations[migrationExecutionAnnotation])
			// Metadata updates during recovery must retain the required immutable group.
			stale := revision.DeepCopy()
			revision.Annotations["test/recovery"] = "retained"
			require.NoError(t, guard.Update(ctx, &revision))
			require.NoError(t, guard.Get(ctx, client.ObjectKeyFromObject(&revision), &revision))
			require.NoError(t, revisionClient.Get(ctx, client.ObjectKeyFromObject(&revision), raw))
			assert.Equal(t, "target-extension", raw.Object["spec"].(map[string]interface{})["group"])
			assert.Equal(t, id, revision.Annotations[migrationExecutionAnnotation])
			// Fetching the live group must not replace the caller's resource version.
			stale.Annotations["test/recovery"] = "stale"
			require.True(t, apierrors.IsConflict(guard.Update(ctx, stale)))
		})
	}
}

// newMigrationRevisionAPIClient enforces the newer CRD's group requirement over HTTP while retaining fields unknown to the pinned Go API.
func newMigrationRevisionAPIClient(t *testing.T, kubeClient client.Client) client.Client {
	t.Helper()
	var lock sync.Mutex
	var stored *unstructured.Unstructured
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		lock.Lock()
		defer lock.Unlock()
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			if stored == nil {
				w.WriteHeader(http.StatusNotFound)
				_ = json.NewEncoder(w).Encode(metav1.Status{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Status"}, Status: metav1.StatusFailure, Code: http.StatusNotFound, Reason: metav1.StatusReasonNotFound})
				return
			}
			_ = json.NewEncoder(w).Encode(stored)
			return
		}
		var revision unstructured.Unstructured
		if err := json.NewDecoder(r.Body).Decode(&revision); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		group, _, err := unstructured.NestedString(revision.Object, "spec", "group")
		if err != nil || group != "target-extension" {
			w.WriteHeader(http.StatusUnprocessableEntity)
			_ = json.NewEncoder(w).Encode(metav1.Status{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Status"}, Status: metav1.StatusFailure, Code: http.StatusUnprocessableEntity, Reason: metav1.StatusReasonInvalid, Message: "spec.group must match the target ClusterExtension"})
			return
		}
		if r.Method == http.MethodPut && (stored == nil || revision.GetResourceVersion() != stored.GetResourceVersion()) {
			w.WriteHeader(http.StatusConflict)
			_ = json.NewEncoder(w).Encode(metav1.Status{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Status"}, Status: metav1.StatusFailure, Code: http.StatusConflict, Reason: metav1.StatusReasonConflict})
			return
		}
		if r.Method == http.MethodPost && stored != nil {
			w.WriteHeader(http.StatusConflict)
			_ = json.NewEncoder(w).Encode(metav1.Status{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Status"}, Status: metav1.StatusFailure, Code: http.StatusConflict, Reason: metav1.StatusReasonAlreadyExists})
			return
		}
		revision.SetUID("revision-uid")
		if r.Method == http.MethodPost {
			revision.SetResourceVersion("1")
		} else {
			revision.SetResourceVersion("2")
		}
		_ = unstructured.SetNestedSlice(revision.Object, []interface{}{
			map[string]interface{}{"type": "Succeeded", "status": "True"},
			map[string]interface{}{"type": "Available", "status": "True"},
		}, "status", "conditions")
		stored = revision.DeepCopy()
		if r.Method == http.MethodPost {
			w.WriteHeader(http.StatusCreated)
		}
		_ = json.NewEncoder(w).Encode(&revision)
	}))
	t.Cleanup(server.Close)
	mapper := meta.NewDefaultRESTMapper([]schema.GroupVersion{ocv1.GroupVersion})
	mapper.Add(ocv1.GroupVersion.WithKind(ocv1.ClusterObjectSetKind), meta.RESTScopeRoot)
	result, err := client.New(&rest.Config{Host: server.URL}, client.Options{Scheme: kubeClient.Scheme(), Mapper: mapper})
	require.NoError(t, err)
	return result
}
