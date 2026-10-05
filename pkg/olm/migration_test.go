package olm

import (
	"context"
	"encoding/json"
	"encoding/pem"
	"errors"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/openshift/console/pkg/auth"
	"github.com/openshift/console/pkg/auth/static"
	operatorsv1 "github.com/operator-framework/api/pkg/operators/v1"
	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/transport/spdy"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func newMigrationTestClient(t *testing.T, objects ...client.Object) client.Client {
	t.Helper()
	operatorControllerInstalled := false
	for _, object := range objects {
		deployment, ok := object.(*appsv1.Deployment)
		if ok && deployment.Name == operatorMigrationControllerDeployName && deployment.Labels[operatorMigrationControllerDeployLabel] == operatorMigrationControllerDeployValue {
			operatorControllerInstalled = true
			break
		}
	}
	if !operatorControllerInstalled {
		objects = append(objects, &appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name: operatorMigrationControllerDeployName, Namespace: "operator-controller",
				Labels: map[string]string{operatorMigrationControllerDeployLabel: operatorMigrationControllerDeployValue},
			},
		})
	}

	scheme := runtime.NewScheme()
	for _, addToScheme := range []func(*runtime.Scheme) error{
		clientgoscheme.AddToScheme,
		operatorsv1.AddToScheme,
		operatorsv1alpha1.AddToScheme,
		ocv1.AddToScheme,
		apiextensionsv1.AddToScheme,
		appsv1.AddToScheme,
		corev1.AddToScheme,
	} {
		require.NoError(t, addToScheme(scheme))
	}

	return fake.NewClientBuilder().WithScheme(scheme).WithObjects(objects...).WithStatusSubresource(&operatorsv1alpha1.Subscription{}).Build()
}

func newMigrationTestHandler(kubeClient client.Client) *OLMHandler {
	return &OLMHandler{
		migrationJobs:        newMigrationJobStore(),
		migrationCoordinator: &migrationCoordinator{client: kubeClient, wakeup: make(chan struct{}, 1)},
		migrationFactory: func(*http.Request) (*migration.Migrator, error) {
			return migration.NewMigrator(kubeClient, nil), nil
		},
	}
}

func TestNewOperatorMigratorCatalogPortForwardTLS(t *testing.T) {
	requests := make(chan *http.Request, 1)
	apiServer := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests <- r
		w.WriteHeader(http.StatusBadRequest)
	}))
	defer apiServer.Close()
	apiServer.Config.ErrorLog = log.New(io.Discard, "", 0)
	caData := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: apiServer.Certificate().Raw})
	caFile := filepath.Join(t.TempDir(), "ca.crt")
	require.NoError(t, os.WriteFile(caFile, caData, 0600))

	tests := []struct {
		name      string
		tlsConfig rest.TLSClientConfig
		trusted   bool
	}{
		{name: "CA data", tlsConfig: rest.TLSClientConfig{CAData: caData}, trusted: true},
		{name: "in-cluster CA file", tlsConfig: rest.TLSClientConfig{CAFile: caFile}, trusted: true},
		{name: "off-cluster skip verification", tlsConfig: rest.TLSClientConfig{Insecure: true}, trusted: true},
		{name: "untrusted certificate", tlsConfig: rest.TLSClientConfig{}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := NewOLMHandler(apiServer.URL, apiServer.Client(), nil, tt.tlsConfig, false).(*OLMHandler)
			request := httptest.NewRequest(http.MethodGet, "/", nil)
			request = request.WithContext(context.WithValue(request.Context(), auth.UserContextKey, &auth.User{Token: "user-token"}))
			migrator, err := handler.newOperatorMigrator(request)
			require.NoError(t, err)
			transport, _, err := spdy.RoundTripperFor(migrator.RESTConfig)
			require.NoError(t, err)
			forwardRequest, err := http.NewRequest(http.MethodPost, apiServer.URL+"/api/v1/namespaces/catalogd/pods/leader/portforward", nil)
			require.NoError(t, err)
			response, err := transport.RoundTrip(forwardRequest)
			if !tt.trusted {
				require.ErrorContains(t, err, "certificate signed by unknown authority")
				return
			}
			require.NoError(t, err)
			defer response.Body.Close()
			assert.Equal(t, http.StatusBadRequest, response.StatusCode)
			forwarded := <-requests
			assert.Equal(t, "Bearer user-token", forwarded.Header.Get("Authorization"))
			assert.Equal(t, "SPDY/3.1", forwarded.Header.Get("Upgrade"))
		})
	}
}

func TestMigrationStatusOrder(t *testing.T) {
	tests := []struct {
		name   string
		status migration.OperatorStatus
		order  int
	}{
		{name: "conflict", status: migration.OperatorStatusConflict, order: 0},
		{name: "ineligible", status: migration.OperatorStatusIneligible, order: 1},
		{name: "already migrated", status: migration.OperatorStatusAlreadyMigrated, order: 2},
		{name: "eligible", status: migration.OperatorStatusEligible, order: 3},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.order, migrationStatusOrder(tt.status))
		})
	}
}

func TestNewOperatorMigrationScanResponsePreservesUIFields(t *testing.T) {
	result := migration.OperatorScanResult{
		SubscriptionName:      "demo",
		SubscriptionNamespace: "operators",
		PackageName:           "demo-package",
		InstalledCSV:          "demo.v1.0.0",
		Version:               "1.0.0",
		State:                 "Succeeded",
		Status:                migration.OperatorStatusConflict,
		Reason:                "migration recovery is required",
		Warnings:              []string{"operator will run in AllNamespaces mode"},
		Error:                 errors.New("recovery required"),
		FailedChecks: []migration.CheckResult{{
			Name: "No namespace selector", Passed: false, Message: "watch scope changes",
		}},
	}

	response := newOperatorMigrationScanResponse(result)
	assert.Equal(t, result.SubscriptionName, response.SubscriptionName)
	assert.Equal(t, result.SubscriptionNamespace, response.SubscriptionNamespace)
	assert.Empty(t, response.ClusterExtensionName)
	assert.Empty(t, response.ClusterObjectSetName)
	assert.Equal(t, result.PackageName, response.PackageName)
	assert.Equal(t, result.InstalledCSV, response.InstalledCSV)
	assert.Equal(t, result.Version, response.Version)
	assert.Equal(t, result.State, response.State)
	assert.Equal(t, result.Status, response.Status)
	assert.Equal(t, result.Reason, response.Reason)
	assert.False(t, response.RecoveryRequired)
	assert.Equal(t, result.Warnings, response.Warnings)
	assert.Equal(t, result.Error.Error(), response.Error)
	require.Len(t, response.FailedChecks, 1)
	assert.Equal(t, "No namespace selector", response.FailedChecks[0].Name)
	assert.False(t, response.FailedChecks[0].Passed)
	assert.Equal(t, "watch scope changes", response.FailedChecks[0].Message)

	alreadyMigrated := newOperatorMigrationScanResponse(migration.OperatorScanResult{
		SubscriptionName: "existing-extension",
		Status:           migration.OperatorStatusAlreadyMigrated,
	})
	assert.Equal(t, "existing-extension", alreadyMigrated.ClusterExtensionName)
}

func TestMigrationScanHandlerClassifiesStatesAndRecovery(t *testing.T) {
	checkpoint := newTestOperatorMigrationCheckpoint(t, &operatorMigrationRecoverySnapshot{
		ClusterExtensionName: "interrupted",
		ClusterObjectSetName: "interrupted-1",
		SubscriptionRef:      "team-c/interrupted",
		SubscriptionSpec:     migrationTestSubscriptionSpec(),
		Namespace:            operatorMigrationNamespaceBackup{Name: "team-c"},
	})
	objects := []client.Object{
		&operatorsv1alpha1.Subscription{
			ObjectMeta: metav1.ObjectMeta{Name: "broken", Namespace: "team-a"},
			Spec:       &operatorsv1alpha1.SubscriptionSpec{Package: "broken-package"},
		},
		&operatorsv1alpha1.Subscription{
			ObjectMeta: metav1.ObjectMeta{Name: "dual", Namespace: "team-a"},
			Spec:       &operatorsv1alpha1.SubscriptionSpec{Package: "dual-package"},
		},
		&operatorsv1alpha1.Subscription{
			ObjectMeta: metav1.ObjectMeta{Name: "partial", Namespace: "team-a"},
			Spec:       &operatorsv1alpha1.SubscriptionSpec{Package: "partial-package"},
		},
		&ocv1.ClusterExtension{
			ObjectMeta: metav1.ObjectMeta{
				Name:        "dual-extension",
				Annotations: map[string]string{migration.MigratedFromSubscriptionAnnotation: "team-a/dual"},
			},
		},
		&ocv1.ClusterExtension{
			ObjectMeta: metav1.ObjectMeta{
				Name:        "already-extension",
				Annotations: map[string]string{migration.MigratedFromSubscriptionAnnotation: "team-b/already"},
			},
			Spec: ocv1.ClusterExtensionSpec{
				Source: ocv1.SourceConfig{Catalog: &ocv1.CatalogFilter{PackageName: "already-package"}},
			},
		},
		&ocv1.ClusterObjectSet{
			ObjectMeta: metav1.ObjectMeta{
				Name:        "partial-extension-1",
				Labels:      map[string]string{migration.LabelOwnerName: "partial-extension"},
				Annotations: map[string]string{migration.MigratedFromSubscriptionAnnotation: "team-a/partial"},
			},
		},
		checkpoint,
	}
	kubeClient := newMigrationTestClient(t, objects...)
	handler := newMigrationTestHandler(kubeClient)
	request := httptest.NewRequest(http.MethodGet, "/", nil)
	response := httptest.NewRecorder()
	handler.migrationScanHandler(response, request)
	assert.Equal(t, http.StatusOK, response.Code)
	var results []operatorMigrationScanResponse
	require.NoError(t, json.NewDecoder(response.Body).Decode(&results))
	bySubscription := make(map[string]operatorMigrationScanResponse, len(results))
	for _, result := range results {
		bySubscription[result.SubscriptionNamespace+"/"+result.SubscriptionName] = result
	}

	assert.Equal(t, migration.OperatorStatusIneligible, bySubscription["team-a/broken"].Status)
	assert.NotEmpty(t, bySubscription["team-a/broken"].Reason)
	assert.Equal(t, migration.OperatorStatusConflict, bySubscription["team-a/dual"].Status)
	assert.Equal(t, "dual-extension", bySubscription["team-a/dual"].ClusterExtensionName)
	assert.Equal(t, migration.OperatorStatusConflict, bySubscription["team-a/partial"].Status)
	assert.True(t, bySubscription["team-a/partial"].RecoveryRequired)
	assert.Equal(t, "partial-extension-1", bySubscription["team-a/partial"].ClusterObjectSetName)
	assert.Equal(t, migration.OperatorStatusAlreadyMigrated, bySubscription["team-b/already"].Status)
	assert.Equal(t, "already-extension", bySubscription["team-b/already"].ClusterExtensionName)
	assert.Equal(t, migration.OperatorStatusConflict, bySubscription["team-c/interrupted"].Status)
	assert.True(t, bySubscription["team-c/interrupted"].RecoveryRequired)
	assert.Equal(t, "interrupted-1", bySubscription["team-c/interrupted"].ClusterObjectSetName)
}

func TestCheckCompatibilityRequiresMatchingSoftAcknowledgements(t *testing.T) {
	group := &operatorsv1.OperatorGroup{
		ObjectMeta: metav1.ObjectMeta{Name: "operator-group", Namespace: "operators"},
		Spec: operatorsv1.OperatorGroupSpec{
			Selector:           &metav1.LabelSelector{MatchLabels: map[string]string{"team": "one"}},
			ServiceAccountName: "scoped-operator",
		},
	}
	kubeClient := newMigrationTestClient(t, group)
	migrator := migration.NewMigrator(kubeClient, nil)
	csv := &operatorsv1alpha1.ClusterServiceVersion{
		ObjectMeta: metav1.ObjectMeta{Name: "operator.v1", Namespace: "operators"},
		Spec: operatorsv1alpha1.ClusterServiceVersionSpec{
			InstallModes: []operatorsv1alpha1.InstallMode{{Type: operatorsv1alpha1.InstallModeTypeAllNamespaces, Supported: true}},
		},
	}
	options := migration.Options{SubscriptionNamespace: "operators"}

	report, err := migrator.CheckCompatibility(context.Background(), options, csv, "")
	require.NoError(t, err)
	assert.Contains(t, checkNames(report.FailedChecks()), "No namespace selector")
	assert.Contains(t, checkNames(report.FailedChecks()), "No scoped ServiceAccount")

	options.AcknowledgeWatchScopeChange = true
	options.AcknowledgeScopedServiceAccount = true
	report, err = migrator.CheckCompatibility(context.Background(), options, csv, "")
	require.NoError(t, err)
	assert.Empty(t, report.FailedChecks())
}

func TestCaptureOperatorMigrationSnapshotBacksUpRollbackState(t *testing.T) {
	replicas := int32(3)
	subscriptionSpec := migrationTestSubscriptionSpec()
	subscription := &operatorsv1alpha1.Subscription{
		ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators"},
		Spec:       &subscriptionSpec,
		Status:     operatorsv1alpha1.SubscriptionStatus{InstalledCSV: "demo.v1.0.0"},
	}
	csv := &operatorsv1alpha1.ClusterServiceVersion{
		ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"},
		Spec: operatorsv1alpha1.ClusterServiceVersionSpec{InstallStrategy: operatorsv1alpha1.NamedInstallStrategy{
			StrategySpec: operatorsv1alpha1.StrategyDetailsDeployment{DeploymentSpecs: []operatorsv1alpha1.StrategyDeploymentSpec{{Name: "demo-operator"}}},
		}},
	}
	operatorGroup := &operatorsv1.OperatorGroup{
		ObjectMeta: metav1.ObjectMeta{Name: "demo-group", Namespace: "operators"},
		Spec:       operatorsv1.OperatorGroupSpec{TargetNamespaces: []string{"operators"}},
	}
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{Name: "demo-operator", Namespace: "operators"},
		Spec:       appsv1.DeploymentSpec{Replicas: &replicas},
	}
	namespace := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{
		Name: "operators", Labels: map[string]string{"pod-security.kubernetes.io/enforce": "restricted"},
	}}
	kubeClient := newMigrationTestClient(t, subscription, csv, operatorGroup, deployment, namespace)
	migrator := migration.NewMigrator(kubeClient, nil)

	snapshot, err := captureOperatorMigrationSnapshot(context.Background(), migrator, migration.Options{
		SubscriptionName: "demo", SubscriptionNamespace: "operators",
	})
	require.NoError(t, err)
	assert.Equal(t, "demo-1", snapshot.ClusterObjectSetName)
	assert.Equal(t, "operators/demo", snapshot.SubscriptionRef)
	assert.Equal(t, migrationTestSubscriptionSpec(), snapshot.SubscriptionSpec)
	assert.Equal(t, "restricted", snapshot.Namespace.Labels["pod-security.kubernetes.io/enforce"])
	require.NotNil(t, snapshot.OperatorGroup)
	assert.Equal(t, "demo-group", snapshot.OperatorGroup.Name)
	assert.Equal(t, operatorGroup.Spec, snapshot.OperatorGroup.Spec)
	require.Len(t, snapshot.Deployments, 1)
	assert.Equal(t, int32(3), snapshot.Deployments[0].Replicas)
}

func TestFailedOperatorMigrationRollsBackFromRecoveryCheckpoint(t *testing.T) {
	replicas := int32(3)
	subscriptionSpec := migrationTestSubscriptionSpec()
	subscription := &operatorsv1alpha1.Subscription{
		ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators"},
		Spec:       &subscriptionSpec,
		Status:     operatorsv1alpha1.SubscriptionStatus{InstalledCSV: "demo.v1.0.0"},
	}
	csv := &operatorsv1alpha1.ClusterServiceVersion{
		ObjectMeta: metav1.ObjectMeta{Name: "demo.v1.0.0", Namespace: "operators"},
		Spec: operatorsv1alpha1.ClusterServiceVersionSpec{InstallStrategy: operatorsv1alpha1.NamedInstallStrategy{
			StrategySpec: operatorsv1alpha1.StrategyDetailsDeployment{DeploymentSpecs: []operatorsv1alpha1.StrategyDeploymentSpec{{Name: "demo-operator"}}},
		}},
	}
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{Name: "demo-operator", Namespace: "operators"},
		Spec:       appsv1.DeploymentSpec{Replicas: &replicas},
	}
	namespace := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "operators"}}
	clusterObjectSetCRD := &apiextensionsv1.CustomResourceDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"},
		Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{
			Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue,
		}}},
	}
	kubeClient := newMigrationTestClient(t, subscription, csv, deployment, namespace, clusterObjectSetCRD)
	migrator := migration.NewMigrator(kubeClient, nil)

	err := migrateOperatorWithRecoveryRunner(
		context.Background(),
		migrator,
		migration.Options{SubscriptionName: "demo", SubscriptionNamespace: "operators"},
		func(ctx context.Context, opts migration.Options) error {
			var sourceDeployment appsv1.Deployment
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKeyFromObject(deployment), &sourceDeployment))
			stopped := int32(0)
			sourceDeployment.Spec.Replicas = &stopped
			require.NoError(t, kubeClient.Update(ctx, &sourceDeployment))
			require.NoError(t, kubeClient.Delete(ctx, subscription))
			require.NoError(t, kubeClient.Create(ctx, &ocv1.ClusterExtension{
				ObjectMeta: metav1.ObjectMeta{
					Name:        opts.ClusterExtensionName,
					Annotations: map[string]string{migration.MigratedFromSubscriptionAnnotation: "operators/demo"},
				},
			}))
			require.NoError(t, kubeClient.Create(ctx, &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{
				Name: opts.ClusterExtensionName + "-1",
				Labels: map[string]string{
					migration.LabelOwnerName: opts.ClusterExtensionName,
				},
				Annotations: map[string]string{migration.MigratedFromSubscriptionAnnotation: "operators/demo"},
			}}))
			return errors.New("injected migration failure")
		},
	)
	var migrationFailure *operatorMigrationFailure
	require.ErrorAs(t, err, &migrationFailure)
	assert.True(t, migrationFailure.rollbackAttempted)
	assert.True(t, migrationFailure.rolledBack)
	assert.ErrorContains(t, err, "rolled back automatically")

	var restoredSubscription operatorsv1alpha1.Subscription
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo", Namespace: "operators"}, &restoredSubscription))
	assert.Equal(t, subscriptionSpec, *restoredSubscription.Spec)
	assert.Equal(t, csv.Name, restoredSubscription.Status.InstalledCSV)
	assert.Equal(t, csv.Name, restoredSubscription.Status.CurrentCSV)
	assert.False(t, restoredSubscription.Status.LastUpdated.IsZero())
	var restoredDeployment appsv1.Deployment
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKeyFromObject(deployment), &restoredDeployment))
	require.NotNil(t, restoredDeployment.Spec.Replicas)
	assert.Equal(t, replicas, *restoredDeployment.Spec.Replicas)
	var remainingExtension ocv1.ClusterExtension
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo"}, &remainingExtension)))
	var remainingObjectSet ocv1.ClusterObjectSet
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo-1"}, &remainingObjectSet)))
	var checkpoints corev1.SecretList
	require.NoError(t, kubeClient.List(context.Background(), &checkpoints, client.MatchingLabels{operatorMigrationCheckpointLabel: "true"}))
	assert.Empty(t, checkpoints.Items)
}

func checkNames(checks []migration.CheckResult) []string {
	names := make([]string, 0, len(checks))
	for _, check := range checks {
		if !check.Passed {
			names = append(names, check.Name)
		}
	}
	return names
}

func TestPrepareClusterObjectSetDoesNotMutateCluster(t *testing.T) {
	crd := &apiextensionsv1.CustomResourceDefinition{
		ObjectMeta: metav1.ObjectMeta{Name: "clusterobjectsets.olm.operatorframework.io"},
		Status: apiextensionsv1.CustomResourceDefinitionStatus{Conditions: []apiextensionsv1.CustomResourceDefinitionCondition{{
			Type: apiextensionsv1.Established, Status: apiextensionsv1.ConditionTrue,
		}}},
	}
	kubeClient := newMigrationTestClient(t, crd)
	migrator := migration.NewMigrator(kubeClient, nil)

	_, err := migrator.PrepareClusterObjectSet(context.Background(), migration.Options{
		SubscriptionName:      "demo",
		SubscriptionNamespace: "operators",
		SystemNamespace:       "operator-controller",
	})
	require.NoError(t, err)

	var extensions ocv1.ClusterExtensionList
	var objectSets ocv1.ClusterObjectSetList
	var secrets corev1.SecretList
	require.NoError(t, kubeClient.List(context.Background(), &extensions))
	require.NoError(t, kubeClient.List(context.Background(), &objectSets))
	require.NoError(t, kubeClient.List(context.Background(), &secrets))
	assert.Empty(t, extensions.Items)
	assert.Empty(t, objectSets.Items)
	assert.Empty(t, secrets.Items)
}

func TestMigrationHandlersDoNotMutateForIneligibleOperator(t *testing.T) {
	tests := []struct {
		name       string
		statusCode int
		handler    func(*OLMHandler, http.ResponseWriter, *http.Request)
	}{
		{name: "dry run", statusCode: http.StatusOK, handler: (*OLMHandler).migrationDryRunHandler},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			subscription := &operatorsv1alpha1.Subscription{
				ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators"},
				Spec:       &operatorsv1alpha1.SubscriptionSpec{Package: "demo-package"},
			}
			kubeClient := newMigrationTestClient(t, subscription)
			handler := newMigrationTestHandler(kubeClient)
			request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"subscriptionName":"demo","subscriptionNamespace":"operators"}`))
			response := httptest.NewRecorder()

			tt.handler(handler, response, request)

			assert.Equal(t, tt.statusCode, response.Code)
			if tt.name == "dry run" {
				var dryRun operatorMigrationDryRunResponse
				require.NoError(t, json.NewDecoder(response.Body).Decode(&dryRun))
				assert.False(t, dryRun.Eligible)
				assert.Equal(t, migration.OperatorStatusIneligible, dryRun.Operator.Status)
				assert.Nil(t, dryRun.Plan)
			}
			var subscriptions operatorsv1alpha1.SubscriptionList
			var extensions ocv1.ClusterExtensionList
			var objectSets ocv1.ClusterObjectSetList
			var secrets corev1.SecretList
			require.NoError(t, kubeClient.List(context.Background(), &subscriptions))
			require.NoError(t, kubeClient.List(context.Background(), &extensions))
			require.NoError(t, kubeClient.List(context.Background(), &objectSets))
			require.NoError(t, kubeClient.List(context.Background(), &secrets))
			require.Len(t, subscriptions.Items, 1)
			assert.Equal(t, "demo-package", subscriptions.Items[0].Spec.Package)
			assert.Empty(t, extensions.Items)
			assert.Empty(t, objectSets.Items)
			assert.Empty(t, secrets.Items)
		})
	}
}

func TestMigrationAcknowledgementsFromQuery(t *testing.T) {
	tests := []struct {
		name    string
		query   string
		want    migration.Options
		wantErr bool
	}{
		{
			name:  "parses all supported acknowledgements",
			query: "acknowledgeWatchScopeChange=true&acknowledgeOperatorCondition=true&acknowledgeOLMv0APIAccess=true&acknowledgeScopedServiceAccount=true&acknowledgeNotSteadyState=true",
			want: migration.Options{
				AcknowledgeWatchScopeChange:     true,
				AcknowledgeOperatorCondition:    true,
				AcknowledgeOLMv0APIAccess:       true,
				AcknowledgeScopedServiceAccount: true,
				AcknowledgeNotSteadyState:       true,
			},
		},
		{name: "rejects invalid boolean", query: "acknowledgeWatchScopeChange=sometimes", wantErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "/?"+tt.query, nil)
			got, err := migrationAcknowledgementsFromQuery(request)
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestMigrationJobSkipsIneligibleOperatorsAndCompletes(t *testing.T) {
	checkpoint := newTestOperatorMigrationCheckpoint(t, &operatorMigrationRecoverySnapshot{
		ClusterExtensionName: "interrupted",
		ClusterObjectSetName: "interrupted-1",
		SubscriptionRef:      "operators/interrupted",
		SubscriptionSpec:     migrationTestSubscriptionSpec(),
		Namespace:            operatorMigrationNamespaceBackup{Name: "operators"},
	})
	tests := []struct {
		name       string
		request    operatorMigrationBulkRequest
		objects    []client.Object
		status     string
		items      int
		itemStatus string
	}{
		{name: "empty all-eligible scan", request: operatorMigrationBulkRequest{AllEligible: true}, status: "Succeeded", items: 0},
		{
			name:    "all-eligible scan skips ineligible operator",
			request: operatorMigrationBulkRequest{AllEligible: true},
			objects: []client.Object{&operatorsv1alpha1.Subscription{
				ObjectMeta: metav1.ObjectMeta{Name: "demo", Namespace: "operators"},
				Spec:       &operatorsv1alpha1.SubscriptionSpec{Package: "demo-package"},
			}},
			status: "Succeeded",
			items:  1,
		},
		{
			name:    "interrupted migration is skipped",
			request: operatorMigrationBulkRequest{AllEligible: true},
			objects: []client.Object{checkpoint},
			status:  "Succeeded",
			items:   1,
		},
		{
			name: "explicit missing operator is skipped",
			request: operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{
				SubscriptionName: "missing", SubscriptionNamespace: "operators",
			}}},
			status:     "CompletedWithErrors",
			items:      1,
			itemStatus: "Failed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			kubeClient := newMigrationTestClient(t, tt.objects...)
			store := newMigrationJobStore()
			job, err := store.create("alice", tt.request)
			require.NoError(t, err)
			handler := &OLMHandler{migrationJobs: store}

			handler.runMigrationJob(job.ID, migration.NewMigrator(kubeClient, nil))

			snapshot, found := store.snapshot(job.ID, "alice")
			require.True(t, found)
			assert.Equal(t, tt.status, snapshot.Status)
			assert.Len(t, snapshot.Items, tt.items)
			if tt.items > 0 {
				itemStatus := tt.itemStatus
				if itemStatus == "" {
					itemStatus = "Skipped"
				}
				assert.Equal(t, itemStatus, snapshot.Items[0].Status)
				if itemStatus == "Failed" {
					assert.NotEmpty(t, snapshot.Items[0].Error)
				} else {
					assert.NotEmpty(t, snapshot.Items[0].Reason)
				}
			}
		})
	}
}

func TestMigrationHandlersRejectMissingIdentity(t *testing.T) {
	tests := []struct {
		name         string
		authDisabled bool
		user         *auth.User
	}{
		{name: "authentication enabled with token only", user: &auth.User{Token: "user-token"}},
		{name: "authentication enabled without user"},
		{name: "authentication enabled with empty user", user: &auth.User{}},
		{name: "authentication disabled without user", authDisabled: true},
		{name: "authentication disabled without token", authDisabled: true, user: &auth.User{}},
	}
	endpoints := []struct {
		name    string
		method  string
		handler func(*OLMHandler, http.ResponseWriter, *http.Request)
	}{
		{name: "create", method: http.MethodPost, handler: (*OLMHandler).migrationBulkHandler},
		{name: "read", method: http.MethodGet, handler: (*OLMHandler).migrationJobHandler},
		{name: "cancel", method: http.MethodPost, handler: (*OLMHandler).migrationJobCancelHandler},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			for _, endpoint := range endpoints {
				t.Run(endpoint.name, func(t *testing.T) {
					handler := newMigrationTestHandler(newMigrationTestClient(t))
					handler.authDisabled = tt.authDisabled
					request := httptest.NewRequest(endpoint.method, "/", strings.NewReader(`{"allEligible":true}`))
					request.Header.Set("Authorization", "Bearer unverified-token")
					request.SetPathValue("jobID", "missing")
					if tt.user != nil {
						request = request.WithContext(context.WithValue(request.Context(), auth.UserContextKey, tt.user))
					}
					response := httptest.NewRecorder()
					endpoint.handler(handler, response, request)
					assert.Equal(t, http.StatusUnauthorized, response.Code, response.Body.String())
				})
			}
		})
	}
}

func TestMigrationBulkHandlerWithStaticAuthentication(t *testing.T) {
	handler := newMigrationTestHandler(newMigrationTestClient(t))
	handler.authDisabled = true
	request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"allEligible":true}`))
	response := httptest.NewRecorder()
	authenticator := static.NewStaticAuthenticator(auth.User{Token: "local-development-token"})
	user, err := authenticator.Authenticate(response, request)
	require.NoError(t, err)
	request = request.WithContext(context.WithValue(request.Context(), auth.UserContextKey, user))
	handler.migrationBulkHandler(response, request)
	require.Equal(t, http.StatusAccepted, response.Code, response.Body.String())
	assert.NotContains(t, response.Body.String(), user.Token)
	var created map[string]string
	require.NoError(t, json.NewDecoder(response.Body).Decode(&created))
	require.NotEmpty(t, created["jobID"])

	poll := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(request.Context())
	poll.SetPathValue("jobID", created["jobID"])
	require.Eventually(t, func() bool {
		result := httptest.NewRecorder()
		handler.migrationJobHandler(result, poll)
		if result.Code != http.StatusOK {
			return false
		}
		var job operatorMigrationJobSnapshot
		if err := json.NewDecoder(result.Body).Decode(&job); err != nil {
			return false
		}
		return job.Status == "Queued"
	}, time.Second, 10*time.Millisecond)
}

func TestMigrationJobCancelIsOwnerScoped(t *testing.T) {
	tests := []struct {
		name         string
		owner        *auth.User
		other        *auth.User
		authDisabled bool
	}{
		{name: "user ID", owner: &auth.User{ID: "alice", Username: "shared", Token: "shared-token"}, other: &auth.User{ID: "bob", Username: "shared", Token: "shared-token"}},
		{name: "username", owner: &auth.User{Username: "alice", Token: "shared-token"}, other: &auth.User{Username: "bob", Token: "shared-token"}},
		{name: "static token", owner: &auth.User{Token: "alice-token"}, other: &auth.User{Token: "bob-token"}, authDisabled: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			requestFor := func(method string, user *auth.User) *http.Request {
				request := httptest.NewRequest(method, "/", nil)
				if user != nil {
					request = request.WithContext(context.WithValue(request.Context(), auth.UserContextKey, user))
				}
				return request
			}
			kubeClient := newMigrationTestClient(t)
			handler := newMigrationTestHandler(kubeClient)
			handler.authDisabled = tt.authDisabled
			owner, err := handler.migrationJobOwner(requestFor(http.MethodGet, tt.owner))
			require.NoError(t, err)
			store := handler.migrationJobs
			job, err := store.create(owner, operatorMigrationBulkRequest{AllEligible: true})
			require.NoError(t, err)
			seedDurableMigrationJob(t, kubeClient, owner, job)
			ctx, cancel := context.WithCancel(context.Background())
			store.setCancel(job.ID, cancel)
			defer cancel()
			jobRequest := func(method string, user *auth.User) *http.Request {
				request := requestFor(method, user)
				request.SetPathValue("jobID", job.ID)
				return request
			}
			for _, user := range []*auth.User{nil, {}} {
				unauthenticated := httptest.NewRecorder()
				handler.migrationJobHandler(unauthenticated, jobRequest(http.MethodGet, user))
				assert.Equal(t, http.StatusUnauthorized, unauthenticated.Code)
			}
			otherUser := httptest.NewRecorder()
			handler.migrationJobHandler(otherUser, jobRequest(http.MethodGet, tt.other))
			assert.Equal(t, http.StatusNotFound, otherUser.Code)
			otherUserCancel := httptest.NewRecorder()
			handler.migrationJobCancelHandler(otherUserCancel, jobRequest(http.MethodPost, tt.other))
			assert.Equal(t, http.StatusConflict, otherUserCancel.Code)
			assert.NoError(t, ctx.Err())
			ownerRead := httptest.NewRecorder()
			handler.migrationJobHandler(ownerRead, jobRequest(http.MethodGet, tt.owner))
			assert.Equal(t, http.StatusOK, ownerRead.Code)
			ownerCancel := httptest.NewRecorder()
			handler.migrationJobCancelHandler(ownerCancel, jobRequest(http.MethodPost, tt.owner))
			assert.Equal(t, http.StatusAccepted, ownerCancel.Code)
			assert.NoError(t, ctx.Err(), "cancellation is delivered through the durable checkpoint")
			owned, err := readDurableMigrationJob(context.Background(), kubeClient, job.ID, owner)
			require.NoError(t, err)
			require.NotNil(t, owned)
			assert.Equal(t, "CancelRequested", owned.Snapshot.Status)
		})
	}
}

func TestRollbackRestoresSubscriptionAndOperatorGroup(t *testing.T) {
	operatorGroupSpec := operatorsv1.OperatorGroupSpec{TargetNamespaces: []string{"operators"}}
	subscriptionSpec := migrationTestSubscriptionSpec()
	zeroReplicas := int32(0)
	snapshot := &operatorMigrationRecoverySnapshot{
		ClusterExtensionName: "demo",
		ClusterObjectSetName: "demo-1",
		SubscriptionRef:      "operators/demo",
		SubscriptionSpec:     subscriptionSpec,
		Namespace: operatorMigrationNamespaceBackup{
			Name: "operators", Labels: map[string]string{"pod-security.kubernetes.io/enforce": "restricted"},
		},
		OperatorGroup: &operatorMigrationOperatorGroupBackup{
			Name: "original-group", Namespace: "operators", Spec: operatorGroupSpec,
		},
		Deployments: []operatorMigrationDeploymentBackup{{Name: "demo-operator", Namespace: "operators", Replicas: 3}},
	}
	checkpoint := newTestOperatorMigrationCheckpoint(t, snapshot)
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{Name: "demo-operator", Namespace: "operators"},
		Spec:       appsv1.DeploymentSpec{Replicas: &zeroReplicas},
	}
	extension := &ocv1.ClusterExtension{
		ObjectMeta: metav1.ObjectMeta{
			Name:        "demo",
			Annotations: map[string]string{migration.MigratedFromSubscriptionAnnotation: "operators/demo"},
		},
	}
	objectSet := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{
		Name: "demo-1", Labels: map[string]string{migration.LabelOwnerName: "demo"},
	}}
	kubeClient := newMigrationTestClient(t, extension, objectSet, checkpoint, deployment)
	migrator := migration.NewMigrator(kubeClient, nil)
	handler := &OLMHandler{}
	require.NoError(t, handler.rollbackOperatorMigration(context.Background(), migrator, "demo", false, false))

	var restored operatorsv1alpha1.Subscription
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo", Namespace: "operators"}, &restored))
	assert.Equal(t, subscriptionSpec, *restored.Spec)
	var restoredGroup operatorsv1.OperatorGroup
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "original-group", Namespace: "operators"}, &restoredGroup))
	assert.Equal(t, operatorGroupSpec, restoredGroup.Spec)
	var restoredNamespace corev1.Namespace
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "operators"}, &restoredNamespace))
	assert.Equal(t, "restricted", restoredNamespace.Labels["pod-security.kubernetes.io/enforce"])
	var restoredDeployment appsv1.Deployment
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo-operator", Namespace: "operators"}, &restoredDeployment))
	require.NotNil(t, restoredDeployment.Spec.Replicas)
	assert.Equal(t, int32(3), *restoredDeployment.Spec.Replicas)
	var remainingExtension ocv1.ClusterExtension
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo"}, &remainingExtension)))
	var remainingObjectSet ocv1.ClusterObjectSet
	assert.True(t, apierrors.IsNotFound(kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo-1"}, &remainingObjectSet)))
	var checkpoints corev1.SecretList
	require.NoError(t, kubeClient.List(context.Background(), &checkpoints, client.MatchingLabels{operatorMigrationCheckpointLabel: "true"}))
	assert.Empty(t, checkpoints.Items)
}

func TestRollbackClusterObjectSetResumesAfterSubscriptionRestoreFailure(t *testing.T) {
	subscriptionSpec := migrationTestSubscriptionSpec()
	snapshot := &operatorMigrationRecoverySnapshot{
		ClusterExtensionName: "demo",
		ClusterObjectSetName: "demo-1",
		SubscriptionRef:      "operators/demo",
		SubscriptionSpec:     subscriptionSpec,
		Namespace:            operatorMigrationNamespaceBackup{Name: "operators"},
	}
	checkpoint := newTestOperatorMigrationCheckpoint(t, snapshot)
	objectSet := &ocv1.ClusterObjectSet{
		ObjectMeta: metav1.ObjectMeta{
			Name:        "demo-1",
			Labels:      map[string]string{migration.LabelOwnerName: "demo"},
			Annotations: map[string]string{migration.MigratedFromSubscriptionAnnotation: "operators/demo"},
		},
	}
	baseClient := newMigrationTestClient(t, &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "operators"}}, objectSet, checkpoint)
	kubeClient := &failSubscriptionCreateClient{Client: baseClient, failNext: true}
	migrator := migration.NewMigrator(kubeClient, nil)
	handler := &OLMHandler{}

	err := handler.rollbackOperatorMigration(context.Background(), migrator, "demo-1", true, false)
	require.ErrorContains(t, err, "injected Subscription create failure")
	var checkpoints corev1.SecretList
	require.NoError(t, baseClient.List(context.Background(), &checkpoints, client.MatchingLabels{operatorMigrationCheckpointLabel: "true"}))
	require.Len(t, checkpoints.Items, 1)
	var deletedObjectSet ocv1.ClusterObjectSet
	assert.True(t, apierrors.IsNotFound(baseClient.Get(context.Background(), client.ObjectKey{Name: "demo-1"}, &deletedObjectSet)))

	require.NoError(t, handler.rollbackOperatorMigration(context.Background(), migrator, "demo-1", true, false))
	var restored operatorsv1alpha1.Subscription
	require.NoError(t, baseClient.Get(context.Background(), client.ObjectKey{Name: "demo", Namespace: "operators"}, &restored))
	assert.Equal(t, subscriptionSpec, *restored.Spec)
	require.NoError(t, baseClient.List(context.Background(), &checkpoints, client.MatchingLabels{operatorMigrationCheckpointLabel: "true"}))
	assert.Empty(t, checkpoints.Items)
}

func TestRollbackRequiresAcknowledgementForInstalledExtension(t *testing.T) {
	extension := &ocv1.ClusterExtension{
		ObjectMeta: metav1.ObjectMeta{Name: "demo"},
		Status: ocv1.ClusterExtensionStatus{Conditions: []metav1.Condition{{
			Type: ocv1.TypeInstalled, Status: metav1.ConditionTrue,
		}}},
	}
	kubeClient := newMigrationTestClient(t, extension)
	migrator := migration.NewMigrator(kubeClient, nil)

	err := migrator.RollbackClusterExtension(context.Background(), "demo", false)
	require.ErrorContains(t, err, "acknowledge-installed")
	var remaining ocv1.ClusterExtension
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: "demo"}, &remaining))
}

func migrationTestSubscriptionSpec() operatorsv1alpha1.SubscriptionSpec {
	return operatorsv1alpha1.SubscriptionSpec{
		Package:                "demo-package",
		CatalogSource:          "catalog",
		CatalogSourceNamespace: "catalogs",
		Channel:                "stable",
	}
}

func newTestOperatorMigrationCheckpoint(t *testing.T, snapshot *operatorMigrationRecoverySnapshot) *corev1.Secret {
	t.Helper()
	encoded, err := json.Marshal(snapshot)
	require.NoError(t, err)
	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      operatorMigrationCheckpointSecretName(snapshot.ClusterExtensionName),
			Namespace: "operator-controller",
			Labels: map[string]string{
				operatorMigrationCheckpointLabel:      "true",
				operatorMigrationCheckpointOwnerLabel: operatorMigrationOwnerHash(snapshot.ClusterExtensionName),
			},
		},
		Type: operatorMigrationCheckpointSecretType,
		Data: map[string][]byte{
			operatorMigrationCheckpointDataKey:  encoded,
			operatorMigrationCheckpointStateKey: []byte(operatorMigrationCheckpointInProgress),
		},
	}
}

type failSubscriptionCreateClient struct {
	client.Client
	failNext bool
}

func (c *failSubscriptionCreateClient) Create(ctx context.Context, object client.Object, options ...client.CreateOption) error {
	if _, isSubscription := object.(*operatorsv1alpha1.Subscription); isSubscription && c.failNext {
		c.failNext = false
		return errors.New("injected Subscription create failure")
	}
	return c.Client.Create(ctx, object, options...)
}
