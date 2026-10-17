package olm

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	coordinationv1 "k8s.io/api/coordination/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	"github.com/openshift/console/pkg/auth"
)

func seedDurableMigrationJob(t *testing.T, kubeClient client.Client, owner string, job *operatorMigrationJob) string {
	t.Helper()
	namespace, err := migrationJobNamespace(job.ID)
	require.NoError(t, err)
	record := durableMigrationJob{Owner: owner, Request: operatorMigrationBulkRequest{Operators: job.candidates}, Snapshot: job.operatorMigrationJobSnapshot}
	encoded, err := encodeMigrationState(record)
	require.NoError(t, err)
	require.NoError(t, kubeClient.Create(context.Background(), &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: namespace, Labels: map[string]string{migrationJobLabel: "true", migrationJobOwnerLabel: migrationUserLabel(owner)}, Annotations: map[string]string{migrationJobOwnerAnnotation: owner}}}))
	require.NoError(t, kubeClient.Create(context.Background(), &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: migrationJobStateName, Namespace: namespace}, Data: map[string][]byte{migrationJobRecordKey: encoded}}))
	require.NoError(t, kubeClient.Create(context.Background(), &corev1.ConfigMap{ObjectMeta: metav1.ObjectMeta{Name: namespace, Namespace: migrationIndexNamespace, Labels: map[string]string{migrationJobLabel: "true", migrationJobOwnerLabel: migrationUserLabel(owner)}, Annotations: map[string]string{migrationJobOwnerAnnotation: owner}}}))
	return namespace
}

func TestMigrationJobsSurviveBackendReplacementAndTokenChanges(t *testing.T) {
	ctx := context.Background()
	kubeClient := newMigrationTestClient(t)
	store := newMigrationJobStore()
	job, err := store.create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionNamespace: "operators", SubscriptionName: "demo"}}})
	require.NoError(t, err)
	job.Status = "Running"
	job.Items[0].Status = "Migrating"
	job.ProgressEvent = &operatorMigrationProgress{Step: migration.ProgressStepCreate, Status: migration.ProgressWaiting, Target: "operators/demo", Message: "Waiting for ClusterExtension demo to reach Installed=True..."}
	job.Items[0].ProgressEvent = job.ProgressEvent
	seedDurableMigrationJob(t, kubeClient, "alice", job)
	// No process-memory store is transferred to this replacement backend.
	replacement := newMigrationTestHandler(kubeClient)
	request := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(context.WithValue(ctx, auth.UserContextKey, &auth.User{ID: "alice", Token: "new-login-token"}))
	response := httptest.NewRecorder()
	replacement.migrationJobsHandler(response, request)
	require.Equal(t, http.StatusOK, response.Code, response.Body.String())
	var jobs []operatorMigrationJobSnapshot
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &jobs))
	require.Len(t, jobs, 1)
	assert.Equal(t, job.ID, jobs[0].ID)
	assert.Equal(t, "Migrating", jobs[0].Items[0].Status)
	assert.Equal(t, job.ProgressEvent, jobs[0].ProgressEvent)
	assert.Equal(t, job.Items[0].ProgressEvent, jobs[0].Items[0].ProgressEvent)
	assert.NotContains(t, response.Body.String(), "new-login-token")

	request = request.WithContext(context.WithValue(ctx, auth.UserContextKey, &auth.User{ID: "bob", Token: "another-token"}))
	response = httptest.NewRecorder()
	replacement.migrationJobsHandler(response, request)
	require.Equal(t, http.StatusOK, response.Code)
	require.NoError(t, json.Unmarshal(response.Body.Bytes(), &jobs))
	assert.Empty(t, jobs)
}

func TestMigrationLeasePreventsConcurrentBackendsAndCanBeReclaimed(t *testing.T) {
	ctx := context.Background()
	kubeClient := newMigrationTestClient(t)
	first := &migrationCoordinator{client: kubeClient, identity: "first"}
	second := &migrationCoordinator{client: kubeClient, identity: "second"}
	claimed, err := first.claim(ctx, "migration")
	require.NoError(t, err)
	require.True(t, claimed)
	claimed, err = second.claim(ctx, "migration")
	require.NoError(t, err)
	require.False(t, claimed)
	var lease coordinationv1.Lease
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: migrationJobStateName, Namespace: "migration"}, &lease))
	expired := metav1.NewMicroTime(time.Now().Add(-migrationLeaseDuration - time.Second))
	lease.Spec.RenewTime = &expired
	require.NoError(t, kubeClient.Update(ctx, &lease))
	claimed, err = second.claim(ctx, "migration")
	require.NoError(t, err)
	require.True(t, claimed)
	assert.ErrorIs(t, first.ownsLease(ctx, "migration"), errMigrationSuspended)
	assert.NoError(t, second.ownsLease(ctx, "migration"))
}

func TestResumingHandoffUsesExistingClusterObjectSetAndExtension(t *testing.T) {
	ctx := context.Background()
	for _, phase := range []string{"cos", "ce", "cleanup", "done"} {
		t.Run(phase, func(t *testing.T) {
			id := "0123456789abcdef0123456789abcdef"
			opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
			annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
			cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{Conditions: []metav1.Condition{{Type: "Succeeded", Status: metav1.ConditionTrue}, {Type: "Available", Status: metav1.ConditionTrue}}}}
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}, Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: "Installed", Status: metav1.ConditionTrue}}}}
			checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
			kubeClient := newMigrationTestClient(t, cos, extension, checkpoint)
			c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
			namespace, _ := migrationJobNamespace(id)
			claimed, err := c.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			journal := &migrationJournal{JobID: id, Phase: phase, Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}}
			// Source Subscription/CSV are already gone. The saved backup remains authoritative.
			journal.Backup.ClusterServiceVersion = &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"}}
			guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: namespace, id: id}
			require.NoError(t, c.advanceJournal(ctx, migration.NewMigrator(guard, nil), namespace, journal))
			assert.Equal(t, "done", journal.Phase)
			var objectSets ocv1.ClusterObjectSetList
			require.NoError(t, kubeClient.List(ctx, &objectSets))
			assert.Len(t, objectSets.Items, 1)
			var extensions ocv1.ClusterExtensionList
			require.NoError(t, kubeClient.List(ctx, &extensions))
			assert.Len(t, extensions.Items, 1)
		})
	}
}

func TestMigrationLibraryWaitsForCurrentClusterObjectSetReadinessWithoutChangingStatus(t *testing.T) {
	for _, tt := range []struct {
		name       string
		conditions []metav1.Condition
		archived   bool
		deleting   bool
		ready      bool
		blocked    bool
	}{
		{name: "current Ready", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 2, Reason: "AllObjectsReady"}}, ready: true},
		{name: "legacy conditions", conditions: []metav1.Condition{{Type: "Succeeded", Status: metav1.ConditionTrue}, {Type: "Available", Status: metav1.ConditionTrue}}, ready: true},
		{name: "rollout incomplete", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionFalse, ObservedGeneration: 2, Reason: "RollingOut"}}},
		{name: "readiness unknown", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionUnknown, ObservedGeneration: 2, Reason: "Reconciling"}}},
		{name: "stale readiness", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 1, Reason: "AllObjectsReady"}}},
		{name: "stale legacy success", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionFalse, ObservedGeneration: 2, Reason: "RollingOut"}, {Type: "Succeeded", Status: metav1.ConditionTrue}, {Type: "Available", Status: metav1.ConditionTrue}}},
		{name: "archived revision", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 2, Reason: "AllObjectsReady"}}, archived: true},
		{name: "deletion pending", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 2, Reason: "AllObjectsReady"}}, deleting: true},
		{name: "blocked revision", conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionFalse, ObservedGeneration: 2, Reason: "Blocked", Message: "fixture validation failed"}}, blocked: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Generation: 2}, Spec: ocv1.ClusterObjectSetSpec{LifecycleState: ocv1.ClusterObjectSetLifecycleStateActive}, Status: ocv1.ClusterObjectSetStatus{Conditions: tt.conditions}}
			if tt.archived {
				cos.Spec.LifecycleState = ocv1.ClusterObjectSetLifecycleStateArchived
			}
			if tt.deleting {
				cos.DeletionTimestamp = &metav1.Time{Time: time.Now()}
				cos.Finalizers = []string{"fixture/hold"}
			}
			kubeClient := newMigrationTestClient(t, cos)
			guard := &migrationExecutionClient{Client: kubeClient}
			m := migration.NewMigrator(guard, nil)
			ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
			defer cancel()
			err := m.WaitForCOSSucceeded(ctx, cos.Name)
			if tt.ready {
				require.NoError(t, err)
				require.NoError(t, m.WaitForClusterObjectSetAvailable(ctx, cos.Name))
			} else if tt.blocked {
				require.ErrorContains(t, err, "fixture validation failed")
			} else {
				require.ErrorIs(t, err, context.DeadlineExceeded)
			}
			var stored ocv1.ClusterObjectSet
			require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKeyFromObject(cos), &stored))
			assert.Equal(t, tt.conditions, stored.Status.Conditions)
		})
	}
}

func TestResumingHandoffUsesReadyCondition(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
	annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
	cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Generation: 1, Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{Conditions: []metav1.Condition{{Type: "Ready", Status: metav1.ConditionTrue, ObservedGeneration: 1, Reason: "AllObjectsReady"}}}}
	extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}, Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: "Installed", Status: metav1.ConditionTrue}}}}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "operator-controller", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
	kubeClient := newMigrationTestClient(t, cos, extension, checkpoint)
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, _ := migrationJobNamespace(id)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "cos", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Backup: migration.Backup{ClusterServiceVersion: &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators"}}}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	ctx, cancel := context.WithTimeout(ctx, time.Second)
	defer cancel()
	require.NoError(t, c.executeCandidate(ctx, migration.NewMigrator(kubeClient, nil), namespace, id, opts))
	saved, err := c.loadJournal(ctx, namespace, opts.SubscriptionNamespace, opts.SubscriptionName)
	require.NoError(t, err)
	assert.Equal(t, "done", saved.Phase)
	var linked ocv1.ClusterExtension
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(extension), &linked))
	assert.Equal(t, checkpoint.Name, linked.Annotations[operatorMigrationCheckpointAnnotation])
}

func TestRemigrationReleasesOnlyVerifiedOrphanedRevisionAnnotations(t *testing.T) {
	for _, tt := range []struct {
		name         string
		sourceChange func(*corev1.ServiceAccount)
		change       func(*corev1.ServiceAccount) []client.Object
		denied       bool
		preserve     bool
	}{
		{name: "orphaned source"},
		{name: "unverified source without ownership metadata", preserve: true, sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
		}},
		{name: "foreign OLMv1 label", preserve: true, sourceChange: func(sa *corev1.ServiceAccount) {
			sa.Labels[migration.LabelOwnerName] = "other"
			sa.Labels["olm.owner"], sa.Labels["olm.owner.namespace"], sa.Labels["olm.owner.kind"] = "demo.v1", "operators", "ClusterServiceVersion"
		}},
		{name: "CSV reference UID does not match backup", preserve: true, sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "operators.coreos.com/v1alpha1", Kind: "ClusterServiceVersion", Name: "demo.v1", UID: "another-csv"}}
		}},
		{name: "CSV labels in another namespace", preserve: true, sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.Namespace = "other-namespace"
			sa.Labels["olm.owner"], sa.Labels["olm.owner.namespace"], sa.Labels["olm.owner.kind"] = "demo.v1", "operators", "ClusterServiceVersion"
		}},
		{name: "restored CSV labels without OLMv1 label", sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.Labels["olm.owner"], sa.Labels["olm.owner.namespace"], sa.Labels["olm.owner.kind"] = "demo.v1", "operators", "ClusterServiceVersion"
		}},
		{name: "restored CSV owner reference without OLMv1 label", sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "operators.coreos.com/v1alpha1", Kind: "ClusterServiceVersion", Name: "demo.v1", UID: "restored-csv"}}
		}, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.OwnerReferences = nil // Simulate orphan deletion of the saved CSV.
			return nil
		}},
		{name: "CSV ownership changed", denied: true, sourceChange: func(sa *corev1.ServiceAccount) {
			delete(sa.Labels, migration.LabelOwnerName)
			sa.Labels["olm.owner"], sa.Labels["olm.owner.namespace"], sa.Labels["olm.owner.kind"] = "demo.v1", "operators", "ClusterServiceVersion"
		}, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.Labels["olm.owner"] = "other.v1"
			return nil
		}},
		{name: "another CSV reference", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "operators.coreos.com/v1alpha1", Kind: "ClusterServiceVersion", Name: "other.v1", UID: "other-csv"}}
			return nil
		}},
		{name: "previous attempt already released marker", change: func(sa *corev1.ServiceAccount) []client.Object {
			delete(sa.Annotations, migrationResourceRevisionAnnotation)
			return nil
		}},
		{name: "replaced resource", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.UID = "replacement"
			return nil
		}},
		{name: "changed revision", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.Annotations[migrationResourceRevisionAnnotation] = "3"
			return nil
		}},
		{name: "changed owner label", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.Labels[migration.LabelOwnerName] = "another"
			return nil
		}},
		{name: "deleting source", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.DeletionTimestamp = &metav1.Time{Time: time.Now()}
			sa.Finalizers = []string{"fixture/hold"}
			return nil
		}},
		{name: "controlled source", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "olm.operatorframework.io/v1", Kind: "ClusterObjectSet", Name: "other-1", UID: "other", Controller: new(true)}}
			return nil
		}},
		{name: "noncontroller revision reference", denied: true, change: func(sa *corev1.ServiceAccount) []client.Object {
			sa.OwnerReferences = []metav1.OwnerReference{{APIVersion: "olm.operatorframework.io/v1", Kind: "ClusterObjectSet", Name: "demo-2", UID: "old-revision"}}
			return nil
		}},
		{name: "existing target extension", denied: true, change: func(*corev1.ServiceAccount) []client.Object {
			return []client.Object{&ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo"}}}
		}},
		{name: "unlabeled initial revision", denied: true, change: func(*corev1.ServiceAccount) []client.Object {
			return []client.Object{&ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1"}}}
		}},
		{name: "existing later revision", denied: true, change: func(*corev1.ServiceAccount) []client.Object {
			return []client.Object{&ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", Labels: map[string]string{migration.LabelOwnerName: "demo"}}}}
		}},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			sa := &corev1.ServiceAccount{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators", UID: "source", Labels: map[string]string{migration.LabelOwnerName: "demo", "customer": "preserved"}, Annotations: map[string]string{migrationResourceRevisionAnnotation: "2", "customer": "preserved"}}, AutomountServiceAccountToken: new(false)}
			if tt.sourceChange != nil {
				tt.sourceChange(sa)
			}
			original, err := runtime.DefaultUnstructuredConverter.ToUnstructured(sa)
			require.NoError(t, err)
			source := unstructured.Unstructured{Object: original}
			source.SetAPIVersion("v1")
			source.SetKind("ServiceAccount")
			journal := &migrationJournal{Options: migration.Options{ClusterExtensionName: "demo"}, SourceObjects: []unstructured.Unstructured{*source.DeepCopy()}, Info: migration.MigrationInfo{CollectedObjects: []unstructured.Unstructured{*source.DeepCopy()}}, Backup: migration.Backup{ClusterServiceVersion: &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators", UID: "restored-csv"}}}}
			var objects []client.Object
			if tt.change != nil {
				objects = tt.change(sa)
			}
			objects = append(objects, sa)
			kubeClient := newMigrationTestClient(t, objects...)
			var before corev1.ServiceAccount
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(sa), &before))
			err = clearOrphanedMigrationRevisionAnnotations(ctx, kubeClient, journal)
			if tt.denied {
				require.Error(t, err)
			} else {
				require.NoError(t, err)
				// Resume after a crash before the phase journal was saved.
				require.NoError(t, clearOrphanedMigrationRevisionAnnotations(ctx, kubeClient, journal))
				if tt.preserve {
					assert.Contains(t, journal.Info.CollectedObjects[0].GetAnnotations(), migrationResourceRevisionAnnotation)
				} else {
					delete(before.Annotations, migrationResourceRevisionAnnotation)
					assert.NotContains(t, journal.Info.CollectedObjects[0].GetAnnotations(), migrationResourceRevisionAnnotation)
				}
			}
			var after corev1.ServiceAccount
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(sa), &after))
			before.ResourceVersion = after.ResourceVersion
			assert.Equal(t, before, after, "only the verified orphaned revision annotation may change")
		})
	}
}

func TestRemigrationReleasesRevisionBeforeCreatingNewHandoff(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators"}
	source := unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "v1", "kind": "ServiceAccount",
		"metadata": map[string]interface{}{
			"name": "demo", "namespace": "operators", "uid": "source",
			"labels":      map[string]interface{}{"olm.owner": "demo.v1", "olm.owner.namespace": "operators", "olm.owner.kind": "ClusterServiceVersion"},
			"annotations": map[string]interface{}{migrationResourceRevisionAnnotation: "2"},
		},
	}}
	kubeClient := newMigrationTestClient(t, &source)
	c := &migrationCoordinator{client: kubeClient, identity: "backend"}
	namespace, _ := migrationJobNamespace(id)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "scale", Options: opts, SourceObjects: []unstructured.Unstructured{*source.DeepCopy()}, Info: migration.MigrationInfo{CollectedObjects: []unstructured.Unstructured{*source.DeepCopy()}}, Backup: migration.Backup{ClusterServiceVersion: &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1", Namespace: "operators", UID: "restored-csv"}}}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	interrupted := errors.New("interrupt before creating new handoff")
	runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Get: func(ctx context.Context, cl client.WithWatch, key client.ObjectKey, obj client.Object, options ...client.GetOption) error {
		if _, ok := obj.(*ocv1.ClusterObjectSet); ok {
			saved, err := c.loadJournal(ctx, namespace, opts.SubscriptionNamespace, opts.SubscriptionName)
			if err != nil {
				return err
			}
			if saved.Phase == "cos" {
				return interrupted
			}
		}
		return cl.Get(ctx, key, obj, options...)
	}})
	m := migration.NewMigrator(&migrationExecutionClient{Client: runner, coordinator: c, namespace: namespace, id: id}, nil)
	require.ErrorIs(t, c.advanceJournal(ctx, m, namespace, journal), interrupted)
	var actual corev1.ServiceAccount
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(&source), &actual))
	assert.Equal(t, source.GetUID(), actual.UID)
	assert.NotContains(t, actual.Annotations, migrationResourceRevisionAnnotation)
	saved, err := c.loadJournal(ctx, namespace, opts.SubscriptionNamespace, opts.SubscriptionName)
	require.NoError(t, err)
	assert.Equal(t, "cos", saved.Phase)
	assert.NotContains(t, saved.Info.CollectedObjects[0].GetAnnotations(), migrationResourceRevisionAnnotation)
}

func TestRemigrationRevisionReleasePreservesConcurrentUpdates(t *testing.T) {
	ctx := context.Background()
	source := unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "v1", "kind": "ServiceAccount",
		"metadata": map[string]interface{}{
			"name": "demo", "namespace": "operators", "uid": "source",
			"labels":      map[string]interface{}{migration.LabelOwnerName: "demo"},
			"annotations": map[string]interface{}{migrationResourceRevisionAnnotation: "2"},
		},
	}}
	kubeClient := newMigrationTestClient(t, &source)
	journal := &migrationJournal{Options: migration.Options{ClusterExtensionName: "demo"}, SourceObjects: []unstructured.Unstructured{*source.DeepCopy()}, Info: migration.MigrationInfo{CollectedObjects: []unstructured.Unstructured{*source.DeepCopy()}}}
	runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.UpdateOption) error {
		var concurrent corev1.ServiceAccount
		if err := cl.Get(ctx, client.ObjectKeyFromObject(obj), &concurrent); err != nil {
			return err
		}
		concurrent.Annotations["customer"] = "concurrent change"
		if err := cl.Update(ctx, &concurrent); err != nil {
			return err
		}
		return cl.Update(ctx, obj, options...)
	}})
	require.True(t, apierrors.IsConflict(clearOrphanedMigrationRevisionAnnotations(ctx, runner, journal)))
	var actual corev1.ServiceAccount
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(&source), &actual))
	assert.Equal(t, "2", actual.Annotations[migrationResourceRevisionAnnotation])
	assert.Equal(t, "concurrent change", actual.Annotations["customer"])
	require.NoError(t, clearOrphanedMigrationRevisionAnnotations(ctx, kubeClient, journal))
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(&source), &actual))
	assert.NotContains(t, actual.Annotations, migrationResourceRevisionAnnotation)
	assert.Equal(t, "concurrent change", actual.Annotations["customer"])
}

func TestResumeCannotAdoptResourcesFromAnotherExecution(t *testing.T) {
	ctx := context.Background()
	kubeClient := newMigrationTestClient(t, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "reference", Namespace: "system", Annotations: map[string]string{migrationExecutionAnnotation: "other"}}, Data: map[string][]byte{"object": []byte("bundle")}})
	c := &migrationCoordinator{client: kubeClient, identity: "backend"}
	claimed, err := c.claim(ctx, "checkpoint")
	require.NoError(t, err)
	require.True(t, claimed)
	guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: "checkpoint", id: "current"}
	err = guard.Create(ctx, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "reference", Namespace: "system"}, Data: map[string][]byte{"object": []byte("bundle")}})
	require.Error(t, err)
	var secret corev1.Secret
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "reference", Namespace: "system"}, &secret))
	assert.Equal(t, "other", secret.Annotations[migrationExecutionAnnotation])
}

func TestReinstalledOperatorMigrationReplacesOnlyItsCompletedCheckpoint(t *testing.T) {
	for _, tt := range []struct {
		name       string
		failDelete bool
		interrupt  bool
		unresolved bool
	}{
		{name: "migration completes"},
		{name: "early failure restores reinstalled operator", failDelete: true},
		{name: "backend resumes after checkpoint claim", interrupt: true},
		{name: "unfinished recovery does not offer another execution's rollback", unresolved: true},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			id := "0123456789abcdef0123456789abcdef"
			opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "operator-controller"}
			previous := &operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo", SubscriptionSpec: migrationTestSubscriptionSpec(), InstalledCSV: "demo.v1.0.0", InstalledCSVUID: "previous-csv"}
			previous.SubscriptionSpec.CatalogSource = "previous-catalog"
			checkpoint := newTestOperatorMigrationCheckpoint(t, previous)
			checkpoint.UID = "checkpoint-uid"
			checkpoint.Annotations = map[string]string{migrationExecutionAnnotation: "previous-execution"}
			checkpoint.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointMigrated)
			if tt.unresolved {
				checkpoint.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointRequired)
			}
			spec := migrationTestSubscriptionSpec()
			subscription := &operatorsv1alpha1.Subscription{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators", UID: "reinstalled-subscription"}, Spec: &spec}
			csv := &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators", UID: "reinstalled-csv"}, Status: operatorsv1alpha1.ClusterServiceVersionStatus{Phase: operatorsv1alpha1.CSVPhaseSucceeded}}
			kubeClient := newMigrationTestClient(t, checkpoint, subscription, csv, &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "operators"}})
			c := &migrationCoordinator{client: kubeClient, identity: "backend"}
			namespace, _ := migrationJobNamespace(id)
			claimed, err := c.claim(ctx, namespace)
			require.NoError(t, err)
			require.True(t, claimed)
			journal := &migrationJournal{JobID: id, Phase: "checkpoint", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Backup: migration.Backup{Subscription: subscription.DeepCopy(), ClusterServiceVersion: csv.DeepCopy()}, Recovery: operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo", SubscriptionSpec: *subscription.Spec.DeepCopy(), InstalledCSV: csv.Name, InstalledCSVUID: csv.UID, Namespace: operatorMigrationNamespaceBackup{Name: "operators"}}}
			require.NoError(t, c.saveJournal(ctx, namespace, journal))
			if tt.interrupt {
				c.client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.UpdateOption) error {
					if obj.GetName() == migrationJournalName("operators", "demo") {
						return errors.New("journal write interrupted")
					}
					return cl.Update(ctx, obj, options...)
				}})
			}
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.DeleteOption) error {
				if _, ok := obj.(*operatorsv1alpha1.ClusterServiceVersion); !ok {
					return cl.Delete(ctx, obj, options...)
				}
				if tt.failDelete {
					return errors.New("CSV deletion denied")
				}
				if err := cl.Delete(ctx, obj, options...); err != nil {
					return err
				}
				// Simulate ready handover targets after the source managers are removed.
				annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
				if err := cl.Create(ctx, &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{Conditions: []metav1.Condition{{Type: "Succeeded", Status: metav1.ConditionTrue}, {Type: "Available", Status: metav1.ConditionTrue}}}}); err != nil {
					return err
				}
				return cl.Create(ctx, &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}, Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: "Installed", Status: metav1.ConditionTrue}}}})
			}})
			if tt.interrupt {
				require.ErrorIs(t, c.executeCandidate(ctx, migration.NewMigrator(runner, nil), namespace, id, opts), errMigrationSuspended)
				var claimedCheckpoint corev1.Secret
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &claimedCheckpoint))
				assert.Equal(t, id, claimedCheckpoint.Annotations[migrationExecutionAnnotation])
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(subscription), &operatorsv1alpha1.Subscription{}))
				c.client = kubeClient
			}
			err = c.executeCandidate(ctx, migration.NewMigrator(runner, nil), namespace, id, opts)
			if tt.unresolved {
				var failure *operatorMigrationFailure
				require.ErrorAs(t, err, &failure)
				assert.ErrorContains(t, err, "already exists")
				assert.False(t, failure.rollbackAttempted)
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(subscription), &operatorsv1alpha1.Subscription{}))
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(csv), &operatorsv1alpha1.ClusterServiceVersion{}))
				var retained corev1.Secret
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &retained))
				assert.Equal(t, checkpoint.Data, retained.Data)
				assert.Equal(t, checkpoint.Annotations, retained.Annotations)
			} else if tt.failDelete {
				require.ErrorContains(t, err, "rolled back automatically")
				var restored operatorsv1alpha1.Subscription
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(subscription), &restored))
				assert.Equal(t, subscription.Spec, restored.Spec)
				assert.Equal(t, csv.Name, restored.Status.InstalledCSV)
				assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &corev1.Secret{})))
			} else {
				require.NoError(t, err)
				var migrated corev1.Secret
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &migrated))
				assert.Equal(t, id, migrated.Annotations[migrationExecutionAnnotation])
				assert.Equal(t, operatorMigrationCheckpointMigrated, string(migrated.Data[operatorMigrationCheckpointStateKey]))
				var saved operatorMigrationRecoverySnapshot
				require.NoError(t, json.Unmarshal(migrated.Data[operatorMigrationCheckpointDataKey], &saved))
				assert.Equal(t, csv.UID, saved.InstalledCSVUID)
				assert.Equal(t, *subscription.Spec, saved.SubscriptionSpec)
				var extension ocv1.ClusterExtension
				require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo"}, &extension))
				assert.Equal(t, migrated.Name, extension.Annotations[operatorMigrationCheckpointAnnotation])
			}
		})
	}
}

func TestCompletedCheckpointReplacementPreservesRecoveryAndActiveTargets(t *testing.T) {
	for _, tt := range []struct {
		name   string
		change func(*corev1.Secret)
		target client.Object
	}{
		{name: "in progress", change: func(s *corev1.Secret) {
			s.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointInProgress)
		}},
		{name: "recovery required", change: func(s *corev1.Secret) {
			s.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointRequired)
		}},
		{name: "unknown state", change: func(s *corev1.Secret) { delete(s.Data, operatorMigrationCheckpointStateKey) }},
		{name: "unexpected type", change: func(s *corev1.Secret) { s.Type = corev1.SecretTypeOpaque }},
		{name: "missing execution", change: func(s *corev1.Secret) { s.Annotations = nil }},
		{name: "checkpoint deletion pending", change: func(s *corev1.Secret) {
			s.Finalizers = []string{"fixture/hold"}
			s.DeletionTimestamp = &metav1.Time{Time: time.Now()}
		}},
		{name: "checkpoint has finalizer", change: func(s *corev1.Secret) { s.Finalizers = []string{"fixture/hold"} }},
		{name: "checkpoint has owner reference", change: func(s *corev1.Secret) {
			s.OwnerReferences = []metav1.OwnerReference{{APIVersion: ocv1.GroupVersion.String(), Kind: "ClusterExtension", Name: "demo", UID: "previous-target"}}
		}},
		{name: "another owner", change: func(s *corev1.Secret) { s.Labels[operatorMigrationCheckpointOwnerLabel] = "other" }},
		{name: "invalid backup", change: func(s *corev1.Secret) { s.Data[operatorMigrationCheckpointDataKey] = []byte("invalid") }},
		{name: "another target backup", change: func(s *corev1.Secret) {
			s.Data[operatorMigrationCheckpointDataKey] = []byte(`{"clusterExtensionName":"other","clusterObjectSetName":"other-1"}`)
		}},
		{name: "ClusterExtension remains", target: &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo"}}},
		{name: "initial revision remains without label", target: &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1"}}},
		{name: "controller revision remains", target: &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", Labels: map[string]string{migration.LabelOwnerName: "demo"}}}},
		{name: "revision is terminating", target: &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", Labels: map[string]string{migration.LabelOwnerName: "demo"}, Finalizers: []string{"fixture/hold"}, DeletionTimestamp: &metav1.Time{Time: time.Now()}}}},
	} {
		t.Run(tt.name, func(t *testing.T) {
			ctx := context.Background()
			snapshot := &operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}
			existing := newTestOperatorMigrationCheckpoint(t, snapshot)
			existing.Annotations = map[string]string{migrationExecutionAnnotation: "previous"}
			existing.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointMigrated)
			if tt.change != nil {
				tt.change(existing)
			}
			objects := []client.Object{existing}
			if tt.target != nil {
				objects = append(objects, tt.target)
			}
			kubeClient := newMigrationTestClient(t, objects...)
			c := &migrationCoordinator{client: kubeClient, identity: "backend"}
			claimed, err := c.claim(ctx, "job")
			require.NoError(t, err)
			require.True(t, claimed)
			guard := &migrationExecutionClient{Client: kubeClient, coordinator: c, namespace: "job", id: "current"}
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(existing), existing))
			before := existing.DeepCopy()
			assert.True(t, apierrors.IsAlreadyExists(guard.Create(ctx, newTestOperatorMigrationCheckpoint(t, snapshot))))
			var retained corev1.Secret
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(existing), &retained))
			assert.Equal(t, *before, retained)
			if tt.target != nil {
				assert.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(tt.target), tt.target))
			}
		})
	}
}

func TestCompletedCheckpointReplacementUsesOptimisticConcurrency(t *testing.T) {
	ctx := context.Background()
	snapshot := &operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo"}
	existing := newTestOperatorMigrationCheckpoint(t, snapshot)
	existing.Annotations = map[string]string{migrationExecutionAnnotation: "previous"}
	existing.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointMigrated)
	kubeClient := newMigrationTestClient(t, existing)
	c := &migrationCoordinator{client: kubeClient, identity: "backend"}
	claimed, err := c.claim(ctx, "job")
	require.NoError(t, err)
	require.True(t, claimed)
	competing := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.UpdateOption) error {
		var concurrent corev1.Secret
		if err := cl.Get(ctx, client.ObjectKeyFromObject(existing), &concurrent); err != nil {
			return err
		}
		concurrent.Annotations[migrationExecutionAnnotation] = "competing-execution"
		concurrent.Data[operatorMigrationCheckpointStateKey] = []byte(operatorMigrationCheckpointInProgress)
		if err := cl.Update(ctx, &concurrent); err != nil {
			return err
		}
		return cl.Update(ctx, obj, options...)
	}})
	guard := &migrationExecutionClient{Client: competing, coordinator: c, namespace: "job", id: "current"}
	require.True(t, apierrors.IsConflict(guard.Create(ctx, newTestOperatorMigrationCheckpoint(t, snapshot))))
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(existing), existing))
	assert.Equal(t, "competing-execution", existing.Annotations[migrationExecutionAnnotation])
	assert.Equal(t, operatorMigrationCheckpointInProgress, string(existing.Data[operatorMigrationCheckpointStateKey]))
}

func TestResumeAfterSourceSubscriptionWasDeleted(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "system"}
	annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
	csv := &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators", UID: "csv-original"}}
	cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}, Status: ocv1.ClusterObjectSetStatus{Conditions: []metav1.Condition{{Type: "Succeeded", Status: metav1.ConditionTrue}, {Type: "Available", Status: metav1.ConditionTrue}}}}
	extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", Annotations: annotations}, Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{Type: "Installed", Status: metav1.ConditionTrue}}}}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "system", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
	kubeClient := newMigrationTestClient(t, csv, cos, extension, checkpoint)
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, _ := migrationJobNamespace(id)
	claimed, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	require.True(t, claimed)
	journal := &migrationJournal{JobID: id, Phase: "prepare", Options: opts, Info: migration.MigrationInfo{PackageName: "demo"}, Backup: migration.Backup{Subscription: &operatorsv1alpha1.Subscription{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators", UID: "subscription-original"}}, ClusterServiceVersion: csv}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	migrator := migration.NewMigrator(kubeClient, nil)
	var progress []migration.ProgressEvent
	migrator.Progress = func(event migration.ProgressEvent) { progress = append(progress, event) }
	require.NoError(t, c.executeCandidate(ctx, migrator, namespace, id, opts))
	require.NotEmpty(t, progress)
	assert.Equal(t, migration.ProgressEvent{Step: migration.ProgressStepPrepare, Status: migration.ProgressStarted, Target: "operators/demo"}, progress[0])
	assert.Equal(t, migration.ProgressEvent{Step: migration.ProgressStepCleanup, Status: migration.ProgressCompleted, Target: "operators/demo"}, progress[len(progress)-1])
	var source operatorsv1alpha1.ClusterServiceVersion
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(csv), &source)))
	saved, err := c.loadJournal(ctx, namespace, "operators", "demo")
	require.NoError(t, err)
	assert.Equal(t, "done", saved.Phase)
}

func TestFailedHandoffPreservesActiveTargetAndDoesNotRestoreSource(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "system"}
	annotations := map[string]string{migrationExecutionAnnotation: id, migration.MigratedFromSubscriptionAnnotation: "operators/demo"}
	cos := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-1", Annotations: annotations}}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "system", Annotations: annotations}, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress)}}
	kubeClient := newMigrationTestClient(t, cos, checkpoint)
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, _ := migrationJobNamespace(id)
	_, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	journal := &migrationJournal{JobID: id, Phase: "ce", Options: opts, Info: migration.MigrationInfo{PackageName: "demo", Channel: "stable"}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	denied := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Create: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.CreateOption) error {
		if _, ok := obj.(*ocv1.ClusterExtension); ok {
			return apierrors.NewForbidden(schema.GroupResource{Group: "olm.operatorframework.io", Resource: "clusterextensions"}, obj.GetName(), errors.New("fixture denies creation"))
		}
		return cl.Create(ctx, obj, options...)
	}})
	err = c.executeCandidate(ctx, migration.NewMigrator(denied, nil), namespace, id, opts)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "migration halted")
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(cos), &ocv1.ClusterObjectSet{}))
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{})))
	saved, err := c.loadJournal(ctx, namespace, "operators", "demo")
	require.NoError(t, err)
	assert.False(t, saved.RolledBack)
	assert.Equal(t, "done", saved.Phase)
}

func TestCheckpointWriteFailureLeavesJobUnfinishedForReplacement(t *testing.T) {
	store := newMigrationJobStore()
	job, err := store.create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "demo", SubscriptionNamespace: "operators"}}})
	require.NoError(t, err)
	outage := errors.New("API unavailable")
	store.persist = func(operatorMigrationJobSnapshot) error { return outage }
	handler := &OLMHandler{migrationJobs: store}
	handler.runMigrationJob(job.ID, migration.NewMigrator(newMigrationTestClient(t), nil))
	assert.ErrorIs(t, store.persistenceError(), outage)
	snapshot, found := store.snapshotForRunner(job.ID)
	require.True(t, found)
	assert.Nil(t, snapshot.FinishedAt)
	assert.NotEqual(t, "Cancelled", snapshot.Status)
}

func TestResumeHonorsPreviouslyFailedItemWhenContinueOnErrorIsFalse(t *testing.T) {
	store := newMigrationJobStore()
	stop := false
	job, err := store.create("alice", operatorMigrationBulkRequest{ContinueOnError: &stop, Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "first", SubscriptionNamespace: "operators"}, {SubscriptionName: "second", SubscriptionNamespace: "operators"}}})
	require.NoError(t, err)
	job.Items[0].Status = "Failed"
	handler := &OLMHandler{migrationJobs: store}
	handler.runMigrationJob(job.ID, migration.NewMigrator(newMigrationTestClient(t), nil))
	snapshot, _ := store.snapshotForRunner(job.ID)
	assert.Equal(t, "CompletedWithErrors", snapshot.Status)
	assert.Equal(t, "Skipped", snapshot.Items[1].Status)
}

func TestDelegatedCredentialsRefreshWithoutTheInitiatingUserToken(t *testing.T) {
	var tokenRequests int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if strings.HasSuffix(r.URL.Path, "/serviceaccounts/migration/token") {
			assert.Equal(t, "Bearer console-service-token", r.Header.Get("Authorization"))
			tokenRequests++
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"apiVersion": "authentication.k8s.io/v1", "kind": "TokenRequest", "status": map[string]interface{}{"token": "delegated-migration-token", "expirationTimestamp": time.Now().Add(30 * time.Second).UTC().Format(time.RFC3339)}})
			return
		}
		assert.Equal(t, "Bearer delegated-migration-token", r.Header.Get("Authorization"))
		_, _ = w.Write([]byte(`{}`))
	}))
	defer server.Close()
	c := &migrationCoordinator{config: &rest.Config{Host: server.URL, BearerToken: "console-service-token"}}
	config, err := c.executionConfig("checkpoint")
	require.NoError(t, err)
	assert.Empty(t, config.BearerToken)
	transport, err := rest.TransportFor(config)
	require.NoError(t, err)
	cl := &http.Client{Transport: transport}
	for i := 0; i < 2; i++ {
		response, err := cl.Get(server.URL + "/resource")
		require.NoError(t, err)
		require.NoError(t, response.Body.Close())
	}
	assert.Equal(t, 2, tokenRequests)
}

func TestRecoveryCheckpointSurvivesAWriteFailureAfterSourceRestoration(t *testing.T) {
	ctx := context.Background()
	id := "0123456789abcdef0123456789abcdef"
	opts := migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators", ClusterExtensionName: "demo", InstallNamespace: "operators", SystemNamespace: "system"}
	checkpoint := &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: operatorMigrationCheckpointSecretName("demo"), Namespace: "system", Annotations: map[string]string{migrationExecutionAnnotation: id}}, Type: operatorMigrationCheckpointSecretType, Data: map[string][]byte{operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointRequired)}}
	kubeClient := newMigrationTestClient(t, checkpoint, &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "operators"}})
	c := &migrationCoordinator{client: kubeClient, identity: "replacement"}
	namespace, _ := migrationJobNamespace(id)
	_, err := c.claim(ctx, namespace)
	require.NoError(t, err)
	journal := &migrationJournal{JobID: id, Phase: "recovery", Failure: "fixture failure", Options: opts, Recovery: operatorMigrationRecoverySnapshot{ClusterExtensionName: "demo", ClusterObjectSetName: "demo-1", SubscriptionRef: "operators/demo", Namespace: operatorMigrationNamespaceBackup{Name: "operators"}, SubscriptionSpec: operatorsv1alpha1.SubscriptionSpec{Package: "demo", CatalogSource: "fixture", CatalogSourceNamespace: "catalog"}}}
	require.NoError(t, c.saveJournal(ctx, namespace, journal))
	c.client = interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Update: func(ctx context.Context, cl client.WithWatch, obj client.Object, options ...client.UpdateOption) error {
		if obj.GetName() == migrationJournalName("operators", "demo") {
			return errors.New("checkpoint storage interrupted")
		}
		return cl.Update(ctx, obj, options...)
	}})
	err = c.executeCandidate(ctx, migration.NewMigrator(kubeClient, nil), namespace, id, opts)
	require.ErrorIs(t, err, errMigrationSuspended)
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{}))
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &corev1.Secret{}))
	c.client = kubeClient
	err = c.executeCandidate(ctx, migration.NewMigrator(kubeClient, nil), namespace, id, opts)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "rolled back automatically")
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(checkpoint), &corev1.Secret{})))
	saved, err := c.loadJournal(ctx, namespace, "operators", "demo")
	require.NoError(t, err)
	assert.True(t, saved.RolledBack)
	assert.Equal(t, "done", saved.Phase)
}

func TestReplacementRunnerContinuesPersistedBatchAfterLongDowntime(t *testing.T) {
	kubeClient := newMigrationTestClient(t)
	original := newMigrationJobStore()
	job, err := original.create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionName: "finished", SubscriptionNamespace: "operators"}, {SubscriptionName: "active", SubscriptionNamespace: "operators"}, {SubscriptionName: "remaining", SubscriptionNamespace: "operators"}}})
	require.NoError(t, err)
	job.CreatedAt = time.Now().Add(-24 * time.Hour)
	job.Items[0].Status = "Succeeded"
	job.Items[1].Status = "Migrating"
	namespace := seedDurableMigrationJob(t, kubeClient, "alice", job)
	record, _, err := loadDurableMigrationJob(context.Background(), kubeClient, namespace)
	require.NoError(t, err)
	replacement := newMigrationJobStore()
	replacement.jobs[job.ID] = &operatorMigrationJob{operatorMigrationJobSnapshot: record.Snapshot, owner: record.Owner, candidates: record.Request.Operators, currentItem: -1}
	var executed []string
	handler := &OLMHandler{migrationJobs: replacement,
		migrationResumeCandidate: func(operatorMigrationOptionsRequest) (bool, error) { return true, nil },
		migrationExecute: func(ctx context.Context, _ *migration.Migrator, options migration.Options) error {
			require.NoError(t, ctx.Err())
			executed = append(executed, options.SubscriptionName)
			return nil
		},
	}
	handler.runMigrationJob(job.ID, migration.NewMigrator(kubeClient, nil))
	assert.Equal(t, []string{"active", "remaining"}, executed)
	snapshot, _ := replacement.snapshotForRunner(job.ID)
	assert.Equal(t, "Succeeded", snapshot.Status)
	for _, item := range snapshot.Items {
		assert.Equal(t, "Succeeded", item.Status)
	}
}

func TestCollectionListsOnlyTheDelegatedNamespaces(t *testing.T) {
	ctx := context.Background()
	objects := []client.Object{}
	for _, namespace := range []string{"source", "related", "outside"} {
		objects = append(objects, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Name: "owned", Namespace: namespace, Labels: map[string]string{"olm.owner": "demo"}}})
	}
	mapper := meta.NewDefaultRESTMapper([]schema.GroupVersion{corev1.SchemeGroupVersion})
	mapper.Add(corev1.SchemeGroupVersion.WithKind("Secret"), meta.RESTScopeNamespace)
	kubeClient := fake.NewClientBuilder().WithScheme(newMigrationTestClient(t).Scheme()).WithObjects(objects...).WithRESTMapper(mapper).Build()
	scoped := interceptor.NewClient(kubeClient, interceptor.Funcs{List: func(ctx context.Context, cl client.WithWatch, list client.ObjectList, options ...client.ListOption) error {
		namespace := (&client.ListOptions{}).ApplyOptions(options).Namespace
		require.NotEmpty(t, namespace, "collection must never ask for cluster-wide Secret access")
		if namespace == "denied" {
			return apierrors.NewForbidden(schema.GroupResource{Resource: "secrets"}, "", errors.New("not delegated"))
		}
		return cl.List(ctx, list, options...)
	}})
	collector := &migrationCollectionClient{Client: scoped, namespaces: []string{"source", "denied", "related"}}
	var secrets unstructured.UnstructuredList
	secrets.SetGroupVersionKind(corev1.SchemeGroupVersion.WithKind("SecretList"))
	require.NoError(t, collector.List(ctx, &secrets, client.MatchingLabels{"olm.owner": "demo"}))
	require.Len(t, secrets.Items, 2)
	assert.Equal(t, "source", secrets.Items[0].GetNamespace())
	assert.Equal(t, "related", secrets.Items[1].GetNamespace())
}

func TestRecoveryCannotAssociateAReplacedCSV(t *testing.T) {
	ctx := context.Background()
	subscription := &operatorsv1alpha1.Subscription{ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators"}}
	csv := &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators", UID: "replacement"}}
	kubeClient := newMigrationTestClient(t, subscription, csv)
	snapshot := &operatorMigrationRecoverySnapshot{InstalledCSV: csv.Name, InstalledCSVUID: "original"}
	err := restoreOperatorMigrationCSVReference(ctx, kubeClient, client.ObjectKeyFromObject(subscription), snapshot)
	require.ErrorContains(t, err, "was replaced")
	var restored operatorsv1alpha1.Subscription
	require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(subscription), &restored))
	assert.Empty(t, restored.Status.InstalledCSV)
	assert.Empty(t, restored.Status.CurrentCSV)
}
