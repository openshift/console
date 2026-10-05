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
