package olm

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strconv"
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
			namespace, namespaceErr := migrationJobNamespace(id)
			require.NoError(t, namespaceErr)
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
	crds := []client.Object{
		&apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}},
		&apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectdeployments.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}},
	}
	runner := interceptor.NewClient(newMigrationTestClient(t, crds...).(client.WithWatch), interceptor.Funcs{Create: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.CreateOption) error {
		if _, target := object.(*ocv1.ClusterObjectDeployment); target {
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

// TestDeploymentAPIPUTAdoptionGate verifies the fixture gates adoption-label PUTs on
// spec generation changes, so a spec-plus-label PUT cannot adopt an unobserved spec.
func TestDeploymentAPIPUTAdoptionGate(t *testing.T) {
	crds := []client.Object{
		&apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}},
		&apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectdeployments.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}},
	}
	kubeClient := newMigrationTestClient(t, crds...)
	deploymentClient := newMigrationDeploymentAPIClient(t, kubeClient)
	ctx := context.Background()

	// Stage the deployment and observe its initial generation.
	created := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "target-extension", Labels: map[string]string{migration.LabelOwnerName: "target-extension"}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionNone}}}}}
	require.NoError(t, deploymentClient.Create(ctx, created))
	var observed ocv1.ClusterObjectDeployment
	require.NoError(t, deploymentClient.Get(ctx, client.ObjectKey{Name: "target-extension"}, &observed))

	// A spec change plus the adoption label bumps the generation; the unobserved
	// generation must be rejected even though protection is set.
	specAndLabel := observed.DeepCopy()
	specAndLabel.Spec.Template.Spec.CollisionProtection = ocv1.CollisionProtectionPrevent
	specAndLabel.Labels = map[string]string{migration.LabelOwnerName: "target-extension", migrationDeploymentManagedByLabel: migrationDeploymentManagedByValue}
	require.True(t, apierrors.IsInvalid(deploymentClient.Update(ctx, specAndLabel)))

	// A different spec field plus the adoption label must also be rejected:
	// the full-spec comparison, not just the protection transition, gates the bump.
	otherSpecAndLabel := observed.DeepCopy()
	otherSpecAndLabel.Spec.ProgressDeadlineMinutes = 42
	otherSpecAndLabel.Labels = map[string]string{migration.LabelOwnerName: "target-extension", migrationDeploymentManagedByLabel: migrationDeploymentManagedByValue}
	require.True(t, apierrors.IsInvalid(deploymentClient.Update(ctx, otherSpecAndLabel)))

	// A spec-only PUT protecting the template bumps the generation again.
	specOnly := observed.DeepCopy()
	specOnly.Spec.Template.Spec.CollisionProtection = ocv1.CollisionProtectionPrevent
	require.NoError(t, deploymentClient.Update(ctx, specOnly))
	require.NoError(t, deploymentClient.Get(ctx, client.ObjectKey{Name: "target-extension"}, &observed))

	// A metadata-only label PUT at the observed, protected generation is accepted.
	labelOnly := observed.DeepCopy()
	labelOnly.Labels = map[string]string{migration.LabelOwnerName: "target-extension", migrationDeploymentManagedByLabel: migrationDeploymentManagedByValue}
	require.NoError(t, deploymentClient.Update(ctx, labelOnly))
}

// TestLibraryStagesThroughTargetDeployment verifies library staging joins the target extension's deployment, including after a lost create response.
func TestLibraryStagesThroughTargetDeployment(t *testing.T) {
	for _, lostResponse := range []bool{false, true} {
		name := "created"
		if lostResponse {
			name = "lost response"
		}
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()
			crds := []client.Object{
				&apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}},
				&apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectdeployments.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}},
			}
			kubeClient := newMigrationTestClient(t, crds...)
			id := "0123456789abcdef0123456789abcdef"
			namespace, namespaceErr := migrationJobNamespace(id)
			require.NoError(t, namespaceErr)
			coordinator := &migrationCoordinator{client: kubeClient, identity: "backend"}
			claimed, err := coordinator.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			deploymentClient := newMigrationDeploymentAPIClient(t, kubeClient)
			created := false
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
				Create: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.CreateOption) error {
					if object.GetObjectKind().GroupVersionKind().Kind != ocv1.ClusterObjectDeploymentKind {
						if _, ok := object.(*ocv1.ClusterObjectDeployment); !ok {
							return cl.Create(ctx, object, options...)
						}
					}
					created = true
					if lostResponse {
						// A lost response never decodes the created object back into the request,
						// so the recovery comparison sees the request's unset defaults.
						request := object.DeepCopyObject().(client.Object)
						if err := deploymentClient.Create(ctx, request, options...); err != nil {
							return err
						}
						return errors.New("create response lost")
					}
					if err := deploymentClient.Create(ctx, object, options...); err != nil {
						return err
					}
					return nil
				},
				Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
					if object.GetObjectKind().GroupVersionKind().Kind == ocv1.ClusterObjectDeploymentKind {
						return deploymentClient.Get(ctx, key, object, options...)
					}
					if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
						return deploymentClient.Get(ctx, key, object, options...)
					}
					return cl.Get(ctx, key, object, options...)
				},
				Update: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.UpdateOption) error {
					if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
						return deploymentClient.Update(ctx, object, options...)
					}
					return cl.Update(ctx, object, options...)
				},
				Patch: func(ctx context.Context, cl client.WithWatch, object client.Object, patch client.Patch, options ...client.PatchOption) error {
					if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
						return deploymentClient.Patch(ctx, object, patch, options...)
					}
					return cl.Patch(ctx, object, patch, options...)
				},
			})
			guard := &migrationExecutionClient{Client: runner, coordinator: coordinator, namespace: namespace, id: id}
			err = migration.NewMigrator(guard, nil).CreateClusterObjectSet(ctx, migration.Options{
				SubscriptionName: "source-subscription", SubscriptionNamespace: "operators",
				ClusterExtensionName: "target-extension", SystemNamespace: "system",
			}, &migration.MigrationInfo{})
			require.NoError(t, err)
			require.True(t, created)
			var deployment ocv1.ClusterObjectDeployment
			require.NoError(t, guard.Get(ctx, client.ObjectKey{Name: "target-extension"}, &deployment))
			assert.Equal(t, "target-extension", deployment.Labels[migration.LabelOwnerName])
			assert.Equal(t, id, deployment.Annotations[migrationExecutionAnnotation])
			// Adoption is enabled only after the protected rollout completes.
			assert.Equal(t, "operator-controller", deployment.Labels["app.kubernetes.io/managed-by"])
			assert.Equal(t, ocv1.CollisionProtectionPrevent, deployment.Spec.Template.Spec.CollisionProtection)
			// Metadata updates during recovery must retain the deployment identity.
			stale := deployment.DeepCopy()
			deployment.Annotations["test/recovery"] = "retained"
			require.NoError(t, guard.Update(ctx, &deployment))
			require.NoError(t, guard.Get(ctx, client.ObjectKeyFromObject(&deployment), &deployment))
			assert.Equal(t, "target-extension", deployment.Labels[migration.LabelOwnerName])
			assert.Equal(t, id, deployment.Annotations[migrationExecutionAnnotation])
			// Fetching the live object must not replace the caller's resource version.
			stale.Annotations["test/recovery"] = "stale"
			require.True(t, apierrors.IsConflict(guard.Update(ctx, stale)))
		})
	}
}

// mergeJSONPatch applies JSON merge-patch semantics to the stored object; it
// covers the object shapes this fixture exchanges and is not a general implementation.
func mergeJSONPatch(dst, patch map[string]interface{}) {
	for key, value := range patch {
		if value == nil {
			delete(dst, key)
			continue
		}
		if nested, ok := value.(map[string]interface{}); ok {
			if existing, ok := dst[key].(map[string]interface{}); ok {
				mergeJSONPatch(existing, nested)
				continue
			}
		}
		dst[key] = value
	}
}

// newMigrationDeploymentAPIClient enforces the deployment ownership label over HTTP, completes rollouts, and retains fields unknown to the pinned Go API.
func newMigrationDeploymentAPIClient(t *testing.T, kubeClient client.Client) client.Client {
	t.Helper()
	var lock sync.Mutex
	var stored *unstructured.Unstructured
	resourceVersion := 0
	staleGets := 0
	observedGeneration := int64(0)
	completeRollout := func(deployment *unstructured.Unstructured) error {
		return unstructured.SetNestedSlice(deployment.Object, []interface{}{
			map[string]interface{}{"type": "Progressing", "status": "False", "reason": ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed, "observedGeneration": deployment.GetGeneration(), "message": "rollout complete"},
			map[string]interface{}{"type": "Available", "status": "True", "observedGeneration": deployment.GetGeneration(), "message": "available"},
		}, "status", "conditions")
	}
	respond := func(w http.ResponseWriter, code int, object interface{}) {
		w.WriteHeader(code)
		if err := json.NewEncoder(w).Encode(object); err != nil {
			t.Errorf("encode ClusterObjectDeployment API response: %v", err)
		}
	}
	status := func(code int, reason metav1.StatusReason, message string) metav1.Status {
		return metav1.Status{TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "Status"}, Status: metav1.StatusFailure, Code: int32(code), Reason: reason, Message: message}
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		lock.Lock()
		defer lock.Unlock()
		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			if stored == nil {
				respond(w, http.StatusNotFound, status(http.StatusNotFound, metav1.StatusReasonNotFound, ""))
				return
			}
			if staleGets > 0 {
				// The controller has not observed the latest generation yet.
				staleGets--
			} else {
				if err := completeRollout(stored); err != nil {
					t.Errorf("complete ClusterObjectDeployment rollout: %v", err)
					return
				}
				observedGeneration = stored.GetGeneration()
			}
			respond(w, http.StatusOK, stored)
			return
		}
		if r.Method == http.MethodPatch {
			var patch map[string]interface{}
			if err := json.NewDecoder(r.Body).Decode(&patch); err != nil || stored == nil {
				http.Error(w, "invalid patch request", http.StatusBadRequest)
				return
			}
			if metadata, ok := patch["metadata"].(map[string]interface{}); ok {
				if version, _ := metadata["resourceVersion"].(string); version != "" && version != stored.GetResourceVersion() {
					respond(w, http.StatusConflict, status(http.StatusConflict, metav1.StatusReasonConflict, ""))
					return
				}
			}
			// Apply the patch to a copy and commit only when it is accepted.
			candidate := stored.DeepCopy()
			mergeJSONPatch(candidate.Object, patch)
			if _, spec := patch["spec"]; spec {
				// The API server bumps the generation for spec changes.
				candidate.SetGeneration(candidate.GetGeneration() + 1)
			}
			if metadata, ok := patch["metadata"].(map[string]interface{}); ok {
				if labels, ok := metadata["labels"].(map[string]interface{}); ok && labels[migrationDeploymentManagedByLabel] == migrationDeploymentManagedByValue {
					// Adoption is enabled only after the protected rollout was observed.
					protection, _, err := unstructured.NestedString(candidate.Object, "spec", "template", "spec", "collisionProtection")
					if err != nil || observedGeneration != candidate.GetGeneration() || protection != string(ocv1.CollisionProtectionPrevent) {
						respond(w, http.StatusUnprocessableEntity, status(http.StatusUnprocessableEntity, metav1.StatusReasonInvalid, "adoption before the protected rollout was observed"))
						return
					}
				}
			}
			resourceVersion++
			candidate.SetResourceVersion(strconv.Itoa(resourceVersion))
			if _, spec := patch["spec"]; spec {
				staleGets = 1
			}
			stored = candidate
			respond(w, http.StatusOK, stored)
			return
		}
		var deployment unstructured.Unstructured
		if err := json.NewDecoder(r.Body).Decode(&deployment); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		if owner := deployment.GetLabels()[migration.LabelOwnerName]; owner != "target-extension" {
			respond(w, http.StatusUnprocessableEntity, status(http.StatusUnprocessableEntity, metav1.StatusReasonInvalid, "metadata.labels owner-name must match the target ClusterExtension"))
			return
		}
		if r.Method == http.MethodPut && (stored == nil || deployment.GetResourceVersion() != stored.GetResourceVersion()) {
			respond(w, http.StatusConflict, status(http.StatusConflict, metav1.StatusReasonConflict, ""))
			return
		}
		if r.Method == http.MethodPost && stored != nil {
			respond(w, http.StatusConflict, status(http.StatusConflict, metav1.StatusReasonAlreadyExists, ""))
			return
		}
		// The API server bumps the generation for any spec change on either write method.
		if stored != nil {
			if !reflect.DeepEqual(deployment.Object["spec"], stored.Object["spec"]) {
				deployment.SetGeneration(stored.GetGeneration() + 1)
			}
		} else if r.Method == http.MethodPost {
			deployment.SetGeneration(1)
		}
		if r.Method == http.MethodPost {
			deployment.SetUID("deployment-uid")
			// The API server defaults an unset revision history limit and rejects a malformed one.
			_, found, err := unstructured.NestedInt64(deployment.Object, "spec", "revisionHistoryLimit")
			if err != nil {
				respond(w, http.StatusUnprocessableEntity, status(http.StatusUnprocessableEntity, metav1.StatusReasonInvalid, "invalid revisionHistoryLimit"))
				return
			}
			if !found {
				// Mirrors the vendored CRD's +kubebuilder:default independently of
				// migrationDeploymentRevisionHistoryDefault so drift fails loudly.
				if err := unstructured.SetNestedField(deployment.Object, int64(5), "spec", "revisionHistoryLimit"); err != nil {
					t.Errorf("default revision history limit: %v", err)
					return
				}
			}
		}
		resourceVersion++
		deployment.SetResourceVersion(strconv.Itoa(resourceVersion))
		if err := completeRollout(&deployment); err != nil {
			t.Errorf("complete ClusterObjectDeployment rollout: %v", err)
			return
		}
		if deployment.GetLabels()[migrationDeploymentManagedByLabel] == migrationDeploymentManagedByValue {
			// Adoption is enabled only after the protected rollout was observed.
			protection, _, err := unstructured.NestedString(deployment.Object, "spec", "template", "spec", "collisionProtection")
			if err != nil || observedGeneration != deployment.GetGeneration() || protection != string(ocv1.CollisionProtectionPrevent) {
				respond(w, http.StatusUnprocessableEntity, status(http.StatusUnprocessableEntity, metav1.StatusReasonInvalid, "adoption before the protected rollout was observed"))
				return
			}
		}
		stored = deployment.DeepCopy()
		code := http.StatusOK
		if r.Method == http.MethodPost {
			code = http.StatusCreated
		}
		respond(w, code, stored)
	}))
	t.Cleanup(server.Close)
	mapper := meta.NewDefaultRESTMapper([]schema.GroupVersion{ocv1.GroupVersion})
	mapper.Add(ocv1.GroupVersion.WithKind(ocv1.ClusterObjectDeploymentKind), meta.RESTScopeRoot)
	result, err := client.New(&rest.Config{Host: server.URL}, client.Options{Scheme: kubeClient.Scheme(), Mapper: mapper})
	require.NoError(t, err)
	return result
}
