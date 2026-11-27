package olm

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"testing"
	"time"

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
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"
)

// TestLibraryBuildsTypedMigrationObjects verifies serialized staging objects use the current SecretReference union.
func TestLibraryBuildsTypedMigrationObjects(t *testing.T) {
	t.Run("ClusterObjectDeployment", func(t *testing.T) {
		kubeClient := newMigrationTestClient(t, &apiextensionsv1.CustomResourceDefinition{
			ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectdeployments.olm.operatorframework.io"},
			Status:     apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}},
		})
		stop := errors.New("stop before rollout")
		var captured client.Object
		runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Create: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.CreateOption) error {
			switch object.(type) {
			case *ocv1.ClusterObjectSet, *ocv1.ClusterObjectDeployment:
				captured = object.DeepCopyObject().(client.Object)
				return stop
			default:
				return cl.Create(ctx, object, options...)
			}
		}})
		info := &migration.MigrationInfo{CollectedObjects: []unstructured.Unstructured{{Object: map[string]interface{}{
			"apiVersion": "v1", "kind": "ConfigMap", "metadata": map[string]interface{}{"name": "demo", "namespace": "operators"},
			"data": map[string]interface{}{"key": "value"},
		}}}}
		err := migration.NewMigrator(runner, nil).CreateClusterObjectSet(context.Background(), migration.Options{
			SubscriptionName: "demo", SubscriptionNamespace: "operators", InstallNamespace: "operators", SystemNamespace: "system", ClusterExtensionName: "demo",
		}, info)
		require.ErrorIs(t, err, stop)
		require.NotNil(t, captured)
		encoded, err := json.Marshal(captured)
		require.NoError(t, err)
		var payload map[string]interface{}
		require.NoError(t, json.Unmarshal(encoded, &payload))
		phases, found, err := unstructured.NestedSlice(payload, "spec", "template", "spec", "phases")
		require.NoError(t, err)
		require.True(t, found)
		require.Len(t, phases, 1)
		entries := phases[0].(map[string]interface{})["objects"].([]interface{})
		require.Len(t, entries, 1)
		entry := entries[0].(map[string]interface{})
		require.Equal(t, string(ocv1.ObjectTypeSecretReference), entry["type"])
		reference := entry["secretRef"].(map[string]interface{})
		require.NotEmpty(t, reference["name"])
		require.NotEmpty(t, reference["key"])
		require.Equal(t, "system", reference["namespace"])
		for _, obsolete := range []string{"object", "ref", "objectRef", "inlineManifest"} {
			require.NotContains(t, entry, obsolete)
		}
	})
}

// migrationDeploymentStatus builds completed rollout conditions for the supplied generation.
func migrationDeploymentStatus(generation int64) ocv1.ClusterObjectDeploymentStatus {
	return ocv1.ClusterObjectDeploymentStatus{Conditions: []metav1.Condition{
		{Type: ocv1.ClusterObjectDeploymentTypeProgressing, Status: metav1.ConditionFalse, Reason: ocv1.ClusterObjectDeploymentReasonNewClusterObjectSetProgressed, ObservedGeneration: generation},
		{Type: ocv1.ClusterObjectDeploymentTypeAvailable, Status: metav1.ConditionTrue, ObservedGeneration: generation},
	}}
}

// TestResumeMigrationDeployment verifies current rollout readiness, terminal failures, and execution ownership on resume.
func TestResumeMigrationDeployment(t *testing.T) {
	for _, tt := range []struct {
		name, reason   string
		generation     int64
		foreign        bool
		manager        string
		adopted        bool
		unobserved     bool
		override       bool
		conflict       bool
		lostPatch      bool
		lostRetarget   bool
		lostSpecChange bool
		recreate       bool
		legacy         bool
		protected      bool
		controller     bool
		legacyJournal  bool
		legacyRevision bool
		legacyServed   bool
		legacyDeleting bool
	}{
		{name: "completed current rollout", generation: 2},
		{name: "stale completion", generation: 1},
		{name: "deadline exceeded", generation: 2, reason: ocv1.ClusterObjectDeploymentReasonProgressDeadlineExceeded},
		{name: "revision collision", generation: 2, reason: ocv1.ClusterObjectDeploymentReasonRevisionObjectCollision},
		{name: "foreign execution", generation: 2, foreign: true},
		{name: "foreign manager", generation: 2, manager: "object-controller"},
		{name: "foreign controller", generation: 2, controller: true},
		{name: "already adopted", generation: 2, adopted: true},
		{name: "unobserved protected rollout", generation: 2, unobserved: true},
		{name: "adopted with unobserved newer generation", generation: 2, adopted: true, unobserved: true},
		{name: "phase override cleared", generation: 2, override: true},
		{name: "patch conflict retried", generation: 2, conflict: true},
		{name: "lost patch response", generation: 2, lostPatch: true},
		{name: "lost patch rejected on retarget", generation: 2, lostRetarget: true},
		{name: "lost patch rejected on spec change", generation: 2, lostSpecChange: true},
		{name: "recreated after deletion", recreate: true},
		{name: "legacy staged adoption", generation: 2, legacy: true},
		{name: "protected before adoption", generation: 2, protected: true},
		{name: "legacy journal staged deployment", generation: 2, legacyJournal: true},
		{name: "legacy journal recreates through deployment", recreate: true, legacyJournal: true},
		{name: "legacy revision ready", legacyRevision: true},
		{name: "legacy revision foreign execution", legacyRevision: true, foreign: true},
		{name: "legacy revision on served cluster", legacyRevision: true, legacyServed: true},
		{name: "legacy revision deleting", legacyRevision: true, legacyDeleting: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: map[string]string{
				migrationExecutionAnnotation: "job", migration.MigratedFromSubscriptionAnnotation: "operators/demo",
			}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionNone}}}}, Status: migrationDeploymentStatus(tt.generation)}
			if tt.adopted {
				deployment.Spec.Template.Spec.CollisionProtection = ocv1.CollisionProtectionPrevent
				deployment.Labels = map[string]string{migrationDeploymentManagedByLabel: migrationDeploymentManagedByValue}
			}
			if tt.unobserved {
				// The protected rollout completed at an earlier generation the controller has not observed.
				deployment.Spec.Template.Spec.CollisionProtection = ocv1.CollisionProtectionPrevent
				deployment.Status = migrationDeploymentStatus(1)
			}
			if tt.override {
				deployment.Spec.Template.Spec.CollisionProtection = ocv1.CollisionProtectionPrevent
				deployment.Spec.Template.Spec.Phases = []ocv1.ClusterObjectSetPhase{{Name: "stage", CollisionProtection: ocv1.CollisionProtectionNone, Objects: []ocv1.ClusterObjectSetObject{{CollisionProtection: ocv1.CollisionProtectionNone}}}}
			}
			if tt.protected {
				deployment.Spec.Template.Spec.CollisionProtection = ocv1.CollisionProtectionPrevent
			}
			if tt.legacy {
				// Earlier library versions stamped the legacy adoption key at creation.
				deployment.Labels = map[string]string{"apps.kubernetes.io/managed-by": "operator-controller"}
			}
			if tt.controller {
				controller := true
				deployment.OwnerReferences = []metav1.OwnerReference{{APIVersion: ocv1.GroupVersion.String(), Kind: ocv1.ClusterExtensionKind, Name: "foreign-extension", UID: "foreign-uid", Controller: &controller}}
			}
			if tt.manager != "" {
				deployment.Labels = map[string]string{migrationDeploymentManagedByLabel: tt.manager}
			}
			if tt.foreign {
				deployment.Annotations[migrationExecutionAnnotation] = "foreign"
			}
			if tt.reason != "" {
				deployment.Status.Conditions[0].Reason = tt.reason
				deployment.Status.Conditions[0].Message = "rollout diagnostics"
			}
			objects := []client.Object{}
			switch {
			case tt.recreate:
				objects = append(objects, &apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectdeployments.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}})
			case tt.legacyRevision:
				revision := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: map[string]string{
					migrationExecutionAnnotation: "job", migration.MigratedFromSubscriptionAnnotation: "operators/demo",
				}}, Status: ocv1.ClusterObjectSetStatus{CompletedAt: metav1.Now(), Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionTrue}}}}
				if tt.foreign {
					revision.Annotations[migrationExecutionAnnotation] = "foreign"
				}
				if tt.legacyDeleting {
					deletion := metav1.Now()
					revision.DeletionTimestamp = &deletion
					revision.Finalizers = []string{"test/retention"}
				}
				objects = append(objects, revision)
			default:
				objects = append(objects, deployment)
			}
			kubeClient := newMigrationTestClient(t, objects...)
			conflicted := false
			stop := errors.New("stop before rollout")
			var created client.Object
			timeout := 500 * time.Millisecond
			if tt.recreate && tt.legacyJournal {
				// The interruption is triggered by the test, not the clock.
				timeout = 5 * time.Second
			}
			ctx, cancel := context.WithTimeout(context.Background(), timeout)
			defer cancel()
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
				Create: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.CreateOption) error {
					if !tt.recreate {
						t.Fatal("resuming must reuse the original deployment")
					}
					if tt.recreate && tt.legacyJournal {
						// Staging proceeds; the interruption fires once it is stored.
						if err := cl.Create(ctx, object, options...); err != nil {
							return err
						}
						cancel()
						return nil
					}
					created = object.DeepCopyObject().(client.Object)
					return stop
				},
				Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
					if _, ok := object.(*ocv1.ClusterObjectDeployment); ok && tt.legacyRevision && !tt.legacyServed {
						// A cluster that never served the deployment API.
						return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
					}
					return cl.Get(ctx, key, object, options...)
				},
				Patch: func(ctx context.Context, cl client.WithWatch, object client.Object, patch client.Patch, options ...client.PatchOption) error {
					cod, ok := object.(*ocv1.ClusterObjectDeployment)
					if !ok {
						return cl.Patch(ctx, object, patch, options...)
					}
					if tt.conflict && cod.Labels[migrationDeploymentManagedByLabel] == "" && !conflicted {
						// A concurrent status write conflicts the first protection attempt.
						conflicted = true
						return apierrors.NewConflict(schema.GroupResource{Group: ocv1.GroupVersion.Group, Resource: "clusterobjectdeployments"}, cod.Name, errors.New("concurrent status write"))
					}
					if tt.lostPatch {
						// Both handoff patches commit, but their responses are lost.
						if err := cl.Patch(ctx, object, patch, options...); err != nil {
							return err
						}
						return errors.New("patch response lost")
					}
					if tt.lostRetarget && cod.Labels[migrationDeploymentManagedByLabel] == "" {
						// The protection patch commits, a concurrent writer retargets the
						// deployment, and the response is lost.
						if err := cl.Patch(ctx, object, patch, options...); err != nil {
							return err
						}
						var stored ocv1.ClusterObjectDeployment
						require.NoError(t, cl.Get(ctx, client.ObjectKey{Name: "demo"}, &stored))
						if stored.Labels == nil {
							stored.Labels = map[string]string{}
						}
						stored.Labels[migration.LabelOwnerName] = "other"
						require.NoError(t, cl.Update(ctx, &stored))
						return errors.New("patch response lost")
					}
					if tt.lostSpecChange && cod.Labels[migrationDeploymentManagedByLabel] == "" {
						// The protection patch commits, a concurrent writer adds an
						// override-free phase, and the response is lost. Protection and
						// overrides still look correct; only the spec comparison catches it.
						if err := cl.Patch(ctx, object, patch, options...); err != nil {
							return err
						}
						var stored ocv1.ClusterObjectDeployment
						require.NoError(t, cl.Get(ctx, client.ObjectKey{Name: "demo"}, &stored))
						stored.Spec.Template.Spec.Phases = []ocv1.ClusterObjectSetPhase{{Name: "stage"}}
						require.NoError(t, cl.Update(ctx, &stored))
						return errors.New("patch response lost")
					}
					return cl.Patch(ctx, object, patch, options...)
				},
			})
			journal := &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: !tt.legacyJournal && !tt.legacyRevision}}
			m := migration.NewMigrator(runner, nil)
			var guard *migrationExecutionClient
			if tt.recreate {
				guard = rollbackTestGuard(t, kubeClient, "")
				guard.Client = runner
				m = migration.NewMigrator(guard, nil)
			}
			err := resumeMigrationRevision(ctx, m, journal)
			switch {
			case tt.lostRetarget, tt.lostSpecChange:
				// The reconciled reread no longer matches the migration's intent.
				require.ErrorContains(t, err, "Cannot protect ClusterObjectDeployment demo")
			case tt.recreate && tt.legacyJournal:
				// Staging started but did not complete; the authoritative deployment
				// rule resumes it on retry, so the journal flag stays untouched.
				require.ErrorIs(t, err, context.Canceled)
				var staged ocv1.ClusterObjectDeployment
				require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo"}, &staged))
				assert.Equal(t, guard.id, staged.Annotations[migrationExecutionAnnotation])
				assert.False(t, journal.Recovery.UseClusterObjectDeployment)
			case tt.recreate:
				require.ErrorIs(t, err, stop)
				staged, ok := created.(*ocv1.ClusterObjectDeployment)
				require.True(t, ok)
				assert.Equal(t, "demo", staged.Labels[migration.LabelOwnerName])
				assert.Equal(t, guard.id, staged.Annotations[migrationExecutionAnnotation])
			case tt.foreign:
				require.ErrorContains(t, err, "different execution")
			case tt.manager != "":
				require.ErrorContains(t, err, tt.manager)
			case tt.legacyServed:
				// The current operator-controller cannot adopt a pre-deployment revision.
				require.ErrorContains(t, err, "staged before ClusterObjectDeployment support")
				assert.False(t, journal.Recovery.UseClusterObjectDeployment)
			case tt.legacyDeleting:
				require.ErrorContains(t, err, "ClusterObjectSet demo-1 is being deleted")
			case tt.legacyRevision:
				require.NoError(t, err)
				// A resumed direct revision keeps the recorded manager.
				assert.False(t, journal.Recovery.UseClusterObjectDeployment)
			case tt.controller:
				require.ErrorContains(t, err, "Another controller manages")
			case tt.reason != "":
				require.ErrorContains(t, err, tt.reason)
				require.ErrorContains(t, err, "rollout diagnostics")
			case tt.adopted && tt.unobserved:
				// The shortcut must not fire: the newer generation never completed.
				require.ErrorIs(t, err, context.DeadlineExceeded)
				require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo"}, deployment))
				assert.Equal(t, migrationDeploymentManagedByValue, deployment.Labels[migrationDeploymentManagedByLabel])
			case tt.generation != 2 || tt.unobserved:
				require.ErrorIs(t, err, context.DeadlineExceeded)
				// Adoption must stay withheld while the current rollout is unobserved.
				require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo"}, deployment))
				assert.Empty(t, deployment.Labels[migrationDeploymentManagedByLabel])
			default:
				require.NoError(t, err)
				assert.Equal(t, tt.conflict, conflicted)
				require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo"}, deployment))
				// Resume must finish the protected adoption the staging path performs.
				assert.Equal(t, ocv1.CollisionProtectionPrevent, deployment.Spec.Template.Spec.CollisionProtection)
				assert.Equal(t, migrationDeploymentManagedByValue, deployment.Labels[migrationDeploymentManagedByLabel])
				if tt.legacy {
					// The legacy marker is ignored, not rewritten.
					assert.Equal(t, "operator-controller", deployment.Labels["apps.kubernetes.io/managed-by"])
				}
				if tt.legacyJournal {
					// A staged deployment is authoritative even for a journal that predates it.
					assert.True(t, journal.Recovery.UseClusterObjectDeployment)
				}
				for _, phase := range deployment.Spec.Template.Spec.Phases {
					assert.Empty(t, phase.CollisionProtection)
					for _, object := range phase.Objects {
						assert.Empty(t, object.CollisionProtection)
					}
				}
			}
		})
	}
}

// TestResumeMigrationDeploymentWaitsForProtectedRollout verifies adoption is
// enabled only after the controller observes the protected generation.
func TestResumeMigrationDeploymentWaitsForProtectedRollout(t *testing.T) {
	deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 1, Annotations: map[string]string{
		migrationExecutionAnnotation: "job", migration.MigratedFromSubscriptionAnnotation: "operators/demo",
	}}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionNone}}}}, Status: migrationDeploymentStatus(1)}
	kubeClient := newMigrationTestClient(t, deployment)
	var events []string
	observing := false
	observed := false
	observations := 0
	runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{
		Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
			if err := cl.Get(ctx, key, object, options...); err != nil {
				return err
			}
			cod, ok := object.(*ocv1.ClusterObjectDeployment)
			if !ok || !observing {
				return nil
			}
			observations++
			if observations == 2 {
				// Sibling revision handoff briefly collides before ownership settles.
				collision := migrationDeploymentStatus(cod.Generation)
				collision.Conditions[0].Reason = ocv1.ClusterObjectDeploymentReasonRevisionObjectCollision
				collision.Conditions[0].Message = "transient revision collision"
				cod.Status = collision
				events = append(events, fmt.Sprintf("transient collision at generation %d", cod.Generation))
				return nil
			}
			if observations > 2 {
				// The deployment controller observed the protected generation.
				cod.Status = migrationDeploymentStatus(cod.Generation)
				if !observed {
					observed = true
					events = append(events, fmt.Sprintf("observed generation %d", cod.Generation))
				}
			}
			return nil
		},
		Patch: func(ctx context.Context, cl client.WithWatch, object client.Object, patch client.Patch, options ...client.PatchOption) error {
			cod, isDeployment := object.(*ocv1.ClusterObjectDeployment)
			if !isDeployment || cod.Labels[migrationDeploymentManagedByLabel] != "" {
				if isDeployment {
					// Adoption is enabled only after the protected rollout was observed.
					require.True(t, observed)
				}
				return cl.Patch(ctx, object, patch, options...)
			}
			if err := cl.Patch(ctx, object, patch, options...); err != nil {
				return err
			}
			// The API server bumps the generation for the template change.
			var stored ocv1.ClusterObjectDeployment
			require.NoError(t, cl.Get(ctx, client.ObjectKeyFromObject(cod), &stored))
			stored.Generation++
			require.NoError(t, cl.Update(ctx, &stored))
			cod.Generation = stored.Generation
			observing = true
			events = append(events, fmt.Sprintf("protected at generation %d", stored.Generation))
			return nil
		},
	})
	journal := &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}}
	require.NoError(t, resumeMigrationRevision(context.Background(), migration.NewMigrator(runner, nil), journal))
	assert.Equal(t, []string{"protected at generation 2", "transient collision at generation 2", "observed generation 2"}, events)
	var adopted ocv1.ClusterObjectDeployment
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo"}, &adopted))
	assert.Equal(t, ocv1.CollisionProtectionPrevent, adopted.Spec.Template.Spec.CollisionProtection)
	assert.Equal(t, migrationDeploymentManagedByValue, adopted.Labels[migrationDeploymentManagedByLabel])
}

// TestLibraryRequiresDeploymentManager verifies staging requires the deployment API and starts a permissive rollout.
func TestLibraryRequiresDeploymentManager(t *testing.T) {
	cosCRD := &apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}}
	codCRD := &apiextensionsv1.CustomResourceDefinition{ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectdeployments.olm.operatorframework.io"}, Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue}}}}
	baseOpts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", SystemNamespace: "system"}

	t.Run("missing deployment API", func(t *testing.T) {
		m := migration.NewMigrator(rollbackTestGuard(t, newMigrationTestClient(t, cosCRD), ""), nil)
		_, err := m.PrepareClusterObjectSet(context.Background(), baseOpts)
		require.ErrorContains(t, err, "ClusterObjectDeployment CRD is required")
	})

	t.Run("deployment", func(t *testing.T) {
		kubeClient := newMigrationTestClient(t, cosCRD, codCRD)
		var created client.Object
		stop := errors.New("stop before target rollout")
		runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Create: func(_ context.Context, _ client.WithWatch, object client.Object, _ ...client.CreateOption) error {
			created = object.DeepCopyObject().(client.Object)
			return stop
		}})
		guard := rollbackTestGuard(t, kubeClient, "")
		guard.Client = runner
		m := migration.NewMigrator(guard, nil)
		opts, err := m.PrepareClusterObjectSet(context.Background(), baseOpts)
		require.NoError(t, err)
		err = m.CreateClusterObjectSet(context.Background(), opts, &migration.MigrationInfo{})
		require.ErrorIs(t, err, stop)
		require.NotNil(t, created)
		assert.Equal(t, guard.id, created.GetAnnotations()[migrationExecutionAnnotation])
		deployment, ok := created.(*ocv1.ClusterObjectDeployment)
		require.True(t, ok)
		assert.Equal(t, ocv1.CollisionProtectionNone, deployment.Spec.Template.Spec.CollisionProtection)
		// The adoption label is applied only after the permissive rollout completes.
		assert.Empty(t, deployment.Labels["app.kubernetes.io/managed-by"])
		assert.Equal(t, "demo", deployment.Labels[migration.LabelOwnerName])
	})
}

// TestRollbackDeploymentPersistsOwnershipAcrossRetries verifies saved deployment and revision identities survive interrupted cleanup.
func TestRollbackDeploymentPersistsOwnershipAcrossRetries(t *testing.T) {
	for _, adopted := range []bool{false, true} {
		name := "before extension creation"
		if adopted {
			name = "adopted deployment"
		}
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()
			kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Annotations: map[string]string{
				migrationExecutionAnnotation: job.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef,
			}}}
			if adopted {
				extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid", Annotations: deployment.Annotations}}
				require.NoError(t, kubeClient.Create(ctx, extension))
				deployment.OwnerReferences = []metav1.OwnerReference{*metav1.NewControllerRef(extension, ocv1.GroupVersion.WithKind(ocv1.ClusterExtensionKind))}
			}
			require.NoError(t, kubeClient.Create(ctx, deployment))
			revision := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", UID: "revision-uid", Generation: 1, OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(deployment, ocv1.GroupVersion.WithKind(ocv1.ClusterObjectDeploymentKind))}}, Spec: ocv1.ClusterObjectSetSpec{Group: "demo"}, Status: ocv1.ClusterObjectSetStatus{Conditions: []metav1.Condition{{Type: ocv1.ClusterObjectSetTypeReady, Status: metav1.ConditionFalse, Reason: ocv1.ClusterObjectSetReasonObjectsNotReady, ObservedGeneration: 1}}}}
			require.NoError(t, kubeClient.Create(ctx, revision))
			reference := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "packed", Namespace: checkpoint.Namespace, Labels: map[string]string{migration.LabelOwnerName: "demo"}, Annotations: map[string]string{migrationExecutionAnnotation: job.ID}}, Type: corev1.SecretType(migration.SecretTypeObjectData)}
			require.NoError(t, kubeClient.Create(ctx, reference))
			rollback := &operatorMigrationRollbackJob{SourceJobID: job.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
			guard := rollbackTestGuard(t, kubeClient, job.ID)
			guard.Client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.DeleteOption) error {
				if _, ok := object.(*ocv1.ClusterObjectSet); ok {
					require.True(t, apierrors.IsNotFound(cl.Get(ctx, client.ObjectKey{Name: "demo"}, &ocv1.ClusterObjectDeployment{})))
					return errors.New("revision cleanup interrupted")
				}
				return cl.Delete(ctx, object, options...)
			}})
			err := executeRollback(ctx, guard, rollback, func() error { t.Fatal("unfinished rollback"); return nil })
			require.ErrorContains(t, err, "revision cleanup interrupted")
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), checkpoint))
			assert.Equal(t, "deployment-uid", checkpoint.Annotations[rollbackDeploymentUIDAnnotation])
			assert.JSONEq(t, `{"demo-1":"revision-uid"}`, checkpoint.Annotations[rollbackRevisionUIDsAnnotation])
			// A replacement backend must accept the saved deployment UID even
			// though the revision still has a dangling controller reference.
			replacement := rollbackTestGuard(t, kubeClient, job.ID)
			rollback.TargetUID = ""
			require.NoError(t, bindRollbackTarget(ctx, replacement, rollback, checkpoint))
			assert.True(t, replacement.ownsRollbackRevision(revision))
			require.NoError(t, (&OLMHandler{}).rollbackFromOperatorMigrationCheckpoint(ctx, replacement, checkpoint, snapshot, true))
			assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(reference), &corev1.Secret{})))
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{}))
		})
	}
}

// TestRollbackRejectsForeignDeploymentAndRevisionsBeforeStoppingControllers prevents recovery from deleting another execution's targets.
func TestRollbackRejectsForeignDeploymentAndRevisionsBeforeStoppingControllers(t *testing.T) {
	for _, foreignDeployment := range []bool{false, true} {
		name := "foreign revision controller"
		if foreignDeployment {
			name = "foreign deployment execution"
		}
		t.Run(name, func(t *testing.T) {
			ctx := context.Background()
			kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
			annotations := map[string]string{migrationExecutionAnnotation: job.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef}
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid", Annotations: annotations}}
			require.NoError(t, kubeClient.Create(ctx, extension))
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Annotations: map[string]string{migrationExecutionAnnotation: job.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef}}}
			if foreignDeployment {
				deployment.Annotations[migrationExecutionAnnotation] = "another-job"
			}
			require.NoError(t, kubeClient.Create(ctx, deployment))
			foreign := deployment.DeepCopy()
			foreign.UID = "foreign-deployment-uid"
			revision := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", UID: "revision-uid", OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(foreign, ocv1.GroupVersion.WithKind(ocv1.ClusterObjectDeploymentKind))}}, Spec: ocv1.ClusterObjectSetSpec{Group: "demo"}}
			require.NoError(t, kubeClient.Create(ctx, revision))
			rollback := &operatorMigrationRollbackJob{SourceJobID: job.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
			guard := rollbackTestGuard(t, kubeClient, job.ID)
			guard.Client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(context.Context, client.WithWatch, client.Object, ...client.DeleteOption) error {
				t.Fatal("foreign ownership must be rejected before deleting resources")
				return nil
			}})
			err := executeRollback(ctx, guard, rollback, func() error { t.Fatal("must not restore"); return nil })
			require.True(t, apierrors.IsConflict(err), "%v", err)
		})
	}
}

// TestRollbackDeploymentResumesAfterExtensionDeletion verifies recovery retains the extension identity between controller deletions.
func TestRollbackDeploymentResumesAfterExtensionDeletion(t *testing.T) {
	for _, tt := range []struct {
		name       string
		forgetUID  bool
		foreignUID bool
	}{
		{name: "verified deleted extension"},
		{name: "missing extension identity", forgetUID: true},
		{name: "different extension owner", foreignUID: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			kubeClient, job, checkpoint, snapshot := seedFailedRollback(t)
			snapshot.UseClusterObjectDeployment = true
			annotations := map[string]string{migrationExecutionAnnotation: job.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef}
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid", Annotations: annotations}}
			require.NoError(t, kubeClient.Create(ctx, extension))
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Annotations: annotations,
				OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(extension, ocv1.GroupVersion.WithKind(ocv1.ClusterExtensionKind))}}}
			require.NoError(t, kubeClient.Create(ctx, deployment))
			rollback := &operatorMigrationRollbackJob{SourceJobID: job.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
			guard := rollbackTestGuard(t, kubeClient, job.ID)
			interrupted := errors.New("deployment deletion interrupted")
			guard.Client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.DeleteOption) error {
				if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
					return interrupted
				}
				return cl.Delete(ctx, object, options...)
			}})
			require.ErrorIs(t, executeRollback(ctx, guard, rollback, func() error { t.Fatal("unfinished rollback"); return nil }), interrupted)
			require.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(extension), &ocv1.ClusterExtension{})))
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), checkpoint))
			require.Equal(t, string(extension.UID), checkpoint.Annotations[rollbackTargetUIDAnnotation])
			if tt.forgetUID {
				delete(checkpoint.Annotations, rollbackTargetUIDAnnotation)
				require.NoError(t, kubeClient.Update(ctx, checkpoint))
			}
			if tt.foreignUID {
				deployment.OwnerReferences[0].UID = "foreign-extension-uid"
				require.NoError(t, kubeClient.Update(ctx, deployment))
			}
			rollback.TargetUID = "" // Only checkpoint state survives the interrupted execution.
			replacement := rollbackTestGuard(t, kubeClient, job.ID)
			err := bindRollbackTarget(ctx, replacement, rollback, checkpoint)
			if tt.forgetUID || tt.foreignUID {
				require.True(t, apierrors.IsConflict(err), "%v", err)
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(deployment), &ocv1.ClusterObjectDeployment{}))
				return
			}
			require.NoError(t, err)
			require.NoError(t, (&OLMHandler{}).rollbackFromOperatorMigrationCheckpoint(ctx, replacement, checkpoint, snapshot, true))
			require.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(deployment), &ocv1.ClusterObjectDeployment{})))
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{}))
		})
	}
}

// TestMigrationDeploymentPlan verifies plans identify the deployment manager and its rollout action.
func TestMigrationDeploymentPlan(t *testing.T) {
	plan := newOperatorMigrationPlan(migration.Options{ClusterExtensionName: "demo"}, &migration.MigrationInfo{})
	assert.Equal(t, "demo", plan.ClusterObjectDeploymentName)
	assert.Contains(t, plan.Actions, "Create ClusterObjectDeployment demo and wait until its rollout completes and operator-controller can take ownership of the migrated resources.")
}

// TestMigrationDeploymentServed verifies the rollback drain gate detects the deployment API.
func TestMigrationDeploymentServed(t *testing.T) {
	kubeClient := newMigrationTestClient(t)
	served, err := migrationDeploymentServed(context.Background(), kubeClient, "demo")
	require.NoError(t, err)
	require.True(t, served)
	absent := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
			return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
		}
		return cl.Get(ctx, key, object, options...)
	}})
	served, err = migrationDeploymentServed(context.Background(), absent, "demo")
	require.NoError(t, err)
	require.False(t, served)
	// Transient failures stay fail-closed: the caller runs its own checks.
	denied := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
			return apierrors.NewForbidden(schema.GroupResource{Group: ocv1.GroupVersion.Group, Resource: "clusterobjectdeployments"}, key.Name, errors.New("delegated grant removed"))
		}
		return cl.Get(ctx, key, object, options...)
	}})
	served, err = migrationDeploymentServed(context.Background(), denied, "demo")
	require.Error(t, err)
	require.True(t, served)
	require.True(t, deploymentServedFailClosed(context.Background(), denied, "demo"))
}

// TestMigrationDeploymentHandoffGuards verifies the fail-closed handoff preconditions.
func TestMigrationDeploymentHandoffGuards(t *testing.T) {
	unobserved := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", Generation: 2}, Status: migrationDeploymentStatus(1)}
	require.ErrorContains(t, requireMigrationDeploymentRollout(unobserved), "has not completed its rollout")

	current := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: map[string]string{
		migrationExecutionAnnotation: "job", migration.MigratedFromSubscriptionAnnotation: "operators/demo",
	}, Labels: map[string]string{migration.LabelOwnerName: "demo"}}}
	expected := current.DeepCopy()
	require.NoError(t, verifyMigrationDeploymentIdentity(current, expected))
	current.Annotations[migration.MigratedFromSubscriptionAnnotation] = "operators/other"
	require.ErrorContains(t, verifyMigrationDeploymentIdentity(current, expected), "no longer matches the migration")
	current.Annotations[migration.MigratedFromSubscriptionAnnotation] = "operators/demo"
	current.Labels[migration.LabelOwnerName] = "other"
	require.ErrorContains(t, verifyMigrationDeploymentIdentity(current, expected), "no longer matches the migration")

	unprotected := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Generation: 2, Annotations: expected.Annotations}, Spec: ocv1.ClusterObjectDeploymentSpec{Template: ocv1.ClusterObjectDeploymentTemplate{Spec: ocv1.ClusterObjectDeploymentTemplateSpec{ClusterObjectSetContent: ocv1.ClusterObjectSetContent{CollisionProtection: ocv1.CollisionProtectionNone}}}}, Status: migrationDeploymentStatus(2)}
	kubeClient := newMigrationTestClient(t, unprotected)
	require.ErrorContains(t, enableMigrationDeploymentAdoption(context.Background(), kubeClient, unprotected), "is not protected before adoption")

	adopted := unprotected.DeepCopy()
	adopted.Spec.Template.Spec.CollisionProtection = ocv1.CollisionProtectionPrevent
	controller := true
	adopted.OwnerReferences = []metav1.OwnerReference{{APIVersion: ocv1.GroupVersion.String(), Kind: ocv1.ClusterExtensionKind, Name: "demo", UID: "extension-uid", Controller: &controller}}
	liveExtension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid"}}
	kubeClient = newMigrationTestClient(t, adopted, liveExtension)
	require.NoError(t, ensureMigrationDeploymentAdopted(context.Background(), migration.NewMigrator(kubeClient, nil), &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}}))
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo"}, adopted))
	assert.Empty(t, adopted.Labels[migrationDeploymentManagedByLabel])

	ownedUnprotected := adopted.DeepCopy()
	ownedUnprotected.Spec.Template.Spec.CollisionProtection = ocv1.CollisionProtectionNone
	kubeClient = newMigrationTestClient(t, ownedUnprotected, liveExtension)
	// Ownership by the live extension proves adoption; the extension controls the template.
	require.NoError(t, ensureMigrationDeploymentAdopted(context.Background(), migration.NewMigrator(kubeClient, nil), &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}}))

	staleOwner := adopted.DeepCopy()
	staleOwner.OwnerReferences[0].UID = "replaced-extension-uid"
	kubeClient = newMigrationTestClient(t, staleOwner, liveExtension)
	require.ErrorContains(t, ensureMigrationDeploymentAdopted(context.Background(), migration.NewMigrator(kubeClient, nil), &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}}), "references a replaced ClusterExtension")

	deletingExtension := liveExtension.DeepCopy()
	deletionTime := metav1.Now()
	deletingExtension.DeletionTimestamp = &deletionTime
	deletingExtension.Finalizers = []string{"test/retention"}
	kubeClient = newMigrationTestClient(t, adopted, deletingExtension)
	require.ErrorContains(t, ensureMigrationDeploymentAdopted(context.Background(), migration.NewMigrator(kubeClient, nil), &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}}), "is being deleted")

	// A fully adopted deployment controlled by a foreign controller is rejected.
	foreignOwned := adopted.DeepCopy()
	foreignOwned.OwnerReferences[0].Kind = ocv1.ClusterObjectDeploymentKind
	foreignOwned.OwnerReferences[0].Name = "foreign-deployment"
	kubeClient = newMigrationTestClient(t, foreignOwned)
	require.ErrorContains(t, ensureMigrationDeploymentAdopted(context.Background(), migration.NewMigrator(kubeClient, nil), &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}}), "Another controller manages")

	deleting := adopted.DeepCopy()
	now := metav1.Now()
	deleting.DeletionTimestamp = &now
	deleting.Finalizers = []string{"test/retention"}
	kubeClient = newMigrationTestClient(t, deleting, liveExtension)
	require.ErrorContains(t, ensureMigrationDeploymentAdopted(context.Background(), migration.NewMigrator(kubeClient, nil), &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}}), "is being deleted")

	kubeClient = newMigrationTestClient(t)
	err := ensureMigrationDeploymentAdopted(context.Background(), migration.NewMigrator(kubeClient, nil), &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}})
	require.ErrorContains(t, err, "Cannot find ClusterObjectDeployment demo")

	// A missing deployment API reports the installation requirement, not a missing object.
	absentAPI := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, object client.Object, options ...client.GetOption) error {
		if _, ok := object.(*ocv1.ClusterObjectDeployment); ok {
			return &meta.NoKindMatchError{GroupKind: schema.GroupKind{Group: ocv1.GroupVersion.Group, Kind: ocv1.ClusterObjectDeploymentKind}}
		}
		return cl.Get(ctx, key, object, options...)
	}})
	err = ensureMigrationDeploymentAdopted(context.Background(), migration.NewMigrator(absentAPI, nil), &migrationJournal{JobID: "job", Options: migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo"}, Recovery: operatorMigrationRecoverySnapshot{UseClusterObjectDeployment: true}})
	require.ErrorContains(t, err, "ClusterObjectDeployment API is not available")
}
