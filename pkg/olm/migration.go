package olm

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"

	operatorsv1 "github.com/operator-framework/api/pkg/operators/v1"
	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apiextensionsv1 "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/validation"
	clientgoscheme "k8s.io/client-go/kubernetes/scheme"
	"k8s.io/client-go/rest"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/openshift/console/pkg/serverutils"
)

type operatorMigrationFactory func(*http.Request) (*migration.Migrator, error)

// operatorMigrator creates a request-scoped migrator, using an injected factory when configured.
func (o *OLMHandler) operatorMigrator(r *http.Request) (*migration.Migrator, error) {
	if o.migrationFactory != nil {
		return o.migrationFactory(r)
	}
	return o.newOperatorMigrator(r)
}

type operatorMigrationOptionsRequest struct {
	SubscriptionName                string `json:"subscriptionName"`
	SubscriptionNamespace           string `json:"subscriptionNamespace"`
	ClusterExtensionName            string `json:"clusterExtensionName,omitempty"`
	InstallNamespace                string `json:"installNamespace,omitempty"`
	AcknowledgeWatchScopeChange     bool   `json:"acknowledgeWatchScopeChange,omitempty"`
	AcknowledgeOperatorCondition    bool   `json:"acknowledgeOperatorCondition,omitempty"`
	AcknowledgeOLMv0APIAccess       bool   `json:"acknowledgeOLMv0APIAccess,omitempty"`
	AcknowledgeScopedServiceAccount bool   `json:"acknowledgeScopedServiceAccount,omitempty"`
	AcknowledgeNotSteadyState       bool   `json:"acknowledgeNotSteadyState,omitempty"`
	DeleteOperatorGroup             bool   `json:"deleteOperatorGroup,omitempty"`
	AcknowledgeNamespaceDelete      bool   `json:"acknowledgeNamespaceDelete,omitempty"`
}

// options converts the API request into library options without applying defaults.
func (r operatorMigrationOptionsRequest) options() migration.Options {
	return migration.Options{
		SubscriptionName:                r.SubscriptionName,
		SubscriptionNamespace:           r.SubscriptionNamespace,
		ClusterExtensionName:            r.ClusterExtensionName,
		InstallNamespace:                r.InstallNamespace,
		AcknowledgeWatchScopeChange:     r.AcknowledgeWatchScopeChange,
		AcknowledgeOperatorCondition:    r.AcknowledgeOperatorCondition,
		AcknowledgeOLMv0APIAccess:       r.AcknowledgeOLMv0APIAccess,
		AcknowledgeScopedServiceAccount: r.AcknowledgeScopedServiceAccount,
		AcknowledgeNotSteadyState:       r.AcknowledgeNotSteadyState,
		DeleteOperatorGroup:             r.DeleteOperatorGroup,
		AcknowledgeNamespaceDelete:      r.AcknowledgeNamespaceDelete,
	}
}

// validate rejects invalid resource names and inconsistent namespace-deletion acknowledgments.
func (r operatorMigrationOptionsRequest) validate() error {
	if err := validateMigrationName("subscriptionName", r.SubscriptionName, false); err != nil {
		return err
	}
	if err := validateMigrationName("subscriptionNamespace", r.SubscriptionNamespace, true); err != nil {
		return err
	}
	if r.ClusterExtensionName != "" {
		if err := validateMigrationName("clusterExtensionName", r.ClusterExtensionName, false); err != nil {
			return err
		}
	}
	if r.InstallNamespace != "" {
		if err := validateMigrationName("installNamespace", r.InstallNamespace, true); err != nil {
			return err
		}
	}
	if r.AcknowledgeNamespaceDelete && (r.InstallNamespace == "" || r.InstallNamespace == r.SubscriptionNamespace) {
		return fmt.Errorf("acknowledgeNamespaceDelete requires installNamespace to differ from subscriptionNamespace")
	}
	return nil
}

// validateMigrationName checks a required name using the Kubernetes rules for resources or namespaces.
func validateMigrationName(field, value string, namespace bool) error {
	if value == "" {
		return fmt.Errorf("%s is required", field)
	}
	var problems []string
	if namespace {
		problems = validation.IsDNS1123Label(value)
	} else {
		problems = validation.IsDNS1123Subdomain(value)
	}
	if len(problems) > 0 {
		return fmt.Errorf("invalid %s: %s", field, problems[0])
	}
	return nil
}

type migrationCheckResponse struct {
	Name    string `json:"name"`
	Passed  bool   `json:"passed"`
	Message string `json:"message"`
}

type operatorMigrationScanResponse struct {
	SubscriptionName      string                   `json:"subscriptionName"`
	SubscriptionNamespace string                   `json:"subscriptionNamespace,omitempty"`
	ClusterExtensionName  string                   `json:"clusterExtensionName,omitempty"`
	ClusterObjectSetName  string                   `json:"clusterObjectSetName,omitempty"`
	PackageName           string                   `json:"packageName,omitempty"`
	InstalledCSV          string                   `json:"installedCSV,omitempty"`
	Version               string                   `json:"version,omitempty"`
	State                 string                   `json:"state,omitempty"`
	Status                migration.OperatorStatus `json:"status"`
	Reason                string                   `json:"reason"`
	Eligible              bool                     `json:"eligible"`
	RecoveryRequired      bool                     `json:"recoveryRequired,omitempty"`
	Warnings              []string                 `json:"warnings,omitempty"`
	Error                 string                   `json:"error,omitempty"`
	FailedChecks          []migrationCheckResponse `json:"failedChecks,omitempty"`
}

// newOperatorMigrationScanResponse copies eligibility checks and operator metadata into the API response.
func newOperatorMigrationScanResponse(result migration.OperatorScanResult) operatorMigrationScanResponse {
	response := operatorMigrationScanResponse{
		SubscriptionName:      result.SubscriptionName,
		SubscriptionNamespace: result.SubscriptionNamespace,
		PackageName:           result.PackageName,
		InstalledCSV:          result.InstalledCSV,
		Version:               result.Version,
		State:                 result.State,
		Status:                result.Status,
		Reason:                result.Reason,
		Eligible:              result.Eligible,
		Warnings:              result.Warnings,
	}
	if result.Error != nil {
		response.Error = result.Error.Error()
	}
	if result.Status == migration.OperatorStatusAlreadyMigrated && response.ClusterExtensionName == "" {
		response.ClusterExtensionName = result.SubscriptionName
	}
	for _, check := range result.FailedChecks {
		response.FailedChecks = append(response.FailedChecks, migrationCheckResponse{
			Name: check.Name, Passed: check.Passed, Message: check.Message,
		})
	}
	return response
}

type migrationResourceCount struct {
	Kind  string `json:"kind"`
	Count int    `json:"count"`
}

type operatorMigrationPlan struct {
	ClusterExtensionName string                   `json:"clusterExtensionName"`
	InstallNamespace     string                   `json:"installNamespace"`
	PackageName          string                   `json:"packageName"`
	Version              string                   `json:"version"`
	Channel              string                   `json:"channel,omitempty"`
	ClusterCatalog       string                   `json:"clusterCatalog"`
	ClusterObjectSetName string                   `json:"clusterObjectSetName"`
	Resources            []migrationResourceCount `json:"resources"`
	Actions              []string                 `json:"actions"`
}

type operatorMigrationDryRunResponse struct {
	Operator      operatorMigrationScanResponse `json:"operator"`
	Eligible      bool                          `json:"eligible"`
	Plan          *operatorMigrationPlan        `json:"plan,omitempty"`
	PlanningError string                        `json:"planningError,omitempty"`
}

// migrationScanHandler reports eligibility and retained recovery conflicts using the caller's Kubernetes permissions.
func (o *OLMHandler) migrationScanHandler(w http.ResponseWriter, r *http.Request) {
	ctx, finish, err := beginMigrationPlanning(r.Context())
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	defer finish()
	r = r.WithContext(ctx)
	migrator, err := o.operatorMigrator(r)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}

	options, err := migrationAcknowledgementsFromQuery(r)
	if err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
		return
	}
	results, err := migrator.ScanAllSubscriptionsWithOptions(r.Context(), options)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	var extensions ocv1.ClusterExtensionList
	if err := migrator.Client.List(r.Context(), &extensions); err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	clusterExtensionBySubscription := make(map[string]string, len(extensions.Items))
	for _, extension := range extensions.Items {
		if ref := extension.Annotations[migration.MigratedFromSubscriptionAnnotation]; ref != "" {
			clusterExtensionBySubscription[ref] = extension.Name
		}
	}

	response := make([]operatorMigrationScanResponse, 0, len(results))
	responseBySubscription := make(map[string]int, len(results))
	for _, result := range results {
		item := newOperatorMigrationScanResponse(result)
		if result.Status == migration.OperatorStatusAlreadyMigrated && item.SubscriptionNamespace == "" {
			if namespace, name, found := migratedFromSubscription(result.State); found {
				item.SubscriptionNamespace = namespace
				item.SubscriptionName = name
			}
		}
		if item.ClusterExtensionName == "" && (result.Status == migration.OperatorStatusConflict || result.Status == migration.OperatorStatusAlreadyMigrated) {
			ref := fmt.Sprintf("%s/%s", result.SubscriptionNamespace, result.SubscriptionName)
			item.ClusterExtensionName = clusterExtensionBySubscription[ref]
		}
		if item.SubscriptionNamespace != "" && item.SubscriptionName != "" {
			responseBySubscription[item.SubscriptionNamespace+"/"+item.SubscriptionName] = len(response)
		}
		response = append(response, item)
	}
	recoveryConflicts, err := listOperatorMigrationRecoveryConflicts(r.Context(), migrator.Client)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	recoveryRefs := make([]string, 0, len(recoveryConflicts))
	for ref := range recoveryConflicts {
		recoveryRefs = append(recoveryRefs, ref)
	}
	sort.Strings(recoveryRefs)
	for _, ref := range recoveryRefs {
		recovery := recoveryConflicts[ref]
		namespace, name, ok := strings.Cut(ref, "/")
		if !ok || namespace == "" || name == "" {
			writeOperatorMigrationError(w, fmt.Errorf("migration recovery metadata contains an invalid Subscription reference %q", ref))
			return
		}
		if index, found := responseBySubscription[ref]; found {
			response[index].Status = migration.OperatorStatusConflict
			response[index].Eligible = false
			response[index].RecoveryRequired = true
			response[index].ClusterExtensionName = recovery.ClusterExtensionName
			response[index].ClusterObjectSetName = recovery.ClusterObjectSetName
			response[index].Reason = recovery.Reason
			continue
		}
		responseBySubscription[ref] = len(response)
		response = append(response, operatorMigrationScanResponse{
			SubscriptionName:      name,
			SubscriptionNamespace: namespace,
			ClusterExtensionName:  recovery.ClusterExtensionName,
			ClusterObjectSetName:  recovery.ClusterObjectSetName,
			State:                 "RecoveryRequired",
			Status:                migration.OperatorStatusConflict,
			Reason:                recovery.Reason,
			RecoveryRequired:      true,
		})
	}
	sort.SliceStable(response, func(i, j int) bool {
		if response[i].Status != response[j].Status {
			return migrationStatusOrder(response[i].Status) < migrationStatusOrder(response[j].Status)
		}
		if response[i].SubscriptionNamespace != response[j].SubscriptionNamespace {
			return response[i].SubscriptionNamespace < response[j].SubscriptionNamespace
		}
		return response[i].SubscriptionName < response[j].SubscriptionName
	})
	serverutils.SendResponse(w, http.StatusOK, response)
}

// migratedFromSubscription splits migration ownership metadata into a source namespace and Subscription name.
func migratedFromSubscription(state string) (namespace, name string, found bool) {
	const marker = " (migrated from "
	_, reference, found := strings.Cut(state, marker)
	if !found || !strings.HasSuffix(reference, ")") {
		return "", "", false
	}
	namespace, name, found = strings.Cut(strings.TrimSuffix(reference, ")"), "/")
	return namespace, name, found && namespace != "" && name != ""
}

// migrationAcknowledgementsFromQuery parses optional scan acknowledgments and rejects malformed boolean values.
func migrationAcknowledgementsFromQuery(r *http.Request) (migration.Options, error) {
	query := r.URL.Query()
	values := map[string]*bool{
		"acknowledgeWatchScopeChange":     new(bool),
		"acknowledgeOperatorCondition":    new(bool),
		"acknowledgeOLMv0APIAccess":       new(bool),
		"acknowledgeScopedServiceAccount": new(bool),
		"acknowledgeNotSteadyState":       new(bool),
	}
	for name, target := range values {
		value := query.Get(name)
		if value == "" {
			continue
		}
		parsed, err := strconv.ParseBool(value)
		if err != nil {
			return migration.Options{}, fmt.Errorf("invalid %s query parameter: %w", name, err)
		}
		*target = parsed
	}
	return migration.Options{
		AcknowledgeWatchScopeChange:     *values["acknowledgeWatchScopeChange"],
		AcknowledgeOperatorCondition:    *values["acknowledgeOperatorCondition"],
		AcknowledgeOLMv0APIAccess:       *values["acknowledgeOLMv0APIAccess"],
		AcknowledgeScopedServiceAccount: *values["acknowledgeScopedServiceAccount"],
		AcknowledgeNotSteadyState:       *values["acknowledgeNotSteadyState"],
	}, nil
}

// migrationStatusOrder ranks eligibility states for deterministic scan-response sorting.
func migrationStatusOrder(status migration.OperatorStatus) int {
	switch status {
	case migration.OperatorStatusConflict:
		return 0
	case migration.OperatorStatusIneligible:
		return 1
	case migration.OperatorStatusAlreadyMigrated:
		return 2
	case migration.OperatorStatusEligible:
		return 3
	default:
		return 4
	}
}

// migrationDryRunHandler checks migration feasibility and returns a resource plan without applying migration changes.
func (o *OLMHandler) migrationDryRunHandler(w http.ResponseWriter, r *http.Request) {
	ctx, finish, err := beginMigrationPlanning(r.Context())
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	defer finish()
	r = r.WithContext(ctx)
	var request operatorMigrationOptionsRequest
	if err := decodeOperatorMigrationRequest(w, r, &request); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
		return
	}
	if err := request.validate(); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
		return
	}

	migrator, err := o.operatorMigrator(r)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	opts := request.options()
	opts.ApplyDefaults()

	scan, err := migrator.ScanSubscription(ctx, opts)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	response := operatorMigrationDryRunResponse{
		Operator: newOperatorMigrationScanResponse(*scan),
		Eligible: scan.Status == migration.OperatorStatusEligible,
	}
	if !response.Eligible {
		serverutils.SendResponse(w, http.StatusOK, response)
		return
	}

	opts, err = migrator.PrepareClusterObjectSet(ctx, opts)
	if err != nil {
		response.Eligible = false
		response.Operator.Eligible = false
		response.PlanningError = err.Error()
		response.Operator.Status = migration.OperatorStatusIneligible
		response.Operator.Reason = err.Error()
		response.Operator.FailedChecks = append(response.Operator.FailedChecks, migrationCheckResponse{
			Name: "OLMv1 prerequisites", Passed: false, Message: err.Error(),
		})
		serverutils.SendResponse(w, http.StatusOK, response)
		return
	}

	info, err := migrator.Gather(ctx, opts)
	if err != nil {
		response.Eligible = false
		response.Operator.Eligible = false
		response.PlanningError = err.Error()
		response.Operator.Status = migration.OperatorStatusIneligible
		response.Operator.Reason = "failed to gather migration resources"
		serverutils.SendResponse(w, http.StatusOK, response)
		return
	}
	catalogName, err := migrator.ResolveClusterCatalog(ctx, info, migrator.RESTConfig)
	if err != nil {
		response.Eligible = false
		response.Operator.Eligible = false
		response.PlanningError = err.Error()
		response.Operator.Status = migration.OperatorStatusIneligible
		response.Operator.Reason = "failed to resolve a target ClusterCatalog"
		response.Operator.FailedChecks = append(response.Operator.FailedChecks, migrationCheckResponse{
			Name: "ClusterCatalog availability", Passed: false, Message: err.Error(),
		})
		serverutils.SendResponse(w, http.StatusOK, response)
		return
	}

	sourceObjects := make([]unstructured.Unstructured, len(info.CollectedObjects))
	for i := range info.CollectedObjects {
		sourceObjects[i] = *info.CollectedObjects[i].DeepCopy()
	}
	targetObjects := make([]unstructured.Unstructured, len(sourceObjects))
	for i := range sourceObjects {
		targetObjects[i] = *sourceObjects[i].DeepCopy()
	}
	migration.RewriteInstallNamespace(targetObjects, opts.SubscriptionNamespace, opts.InstallNamespace)
	if err := migrator.EnsureTargetNamespaceResourcesAbsent(ctx, sourceObjects, targetObjects, opts); err != nil {
		response.Eligible = false
		response.Operator.Eligible = false
		response.PlanningError = err.Error()
		response.Operator.Status = migration.OperatorStatusIneligible
		response.Operator.Reason = "target namespace preflight failed"
		response.Operator.FailedChecks = append(response.Operator.FailedChecks, migrationCheckResponse{
			Name: "Target namespace resources", Passed: false, Message: err.Error(),
		})
		serverutils.SendResponse(w, http.StatusOK, response)
		return
	}

	info.ResolvedCatalogName = catalogName
	response.Plan = newOperatorMigrationPlan(opts, info)
	serverutils.SendResponse(w, http.StatusOK, response)
}

// newOperatorMigrationPlan summarizes collected resources and planned actions for migration review.
func newOperatorMigrationPlan(opts migration.Options, info *migration.MigrationInfo) *operatorMigrationPlan {
	counts := make(map[string]int)
	for _, resource := range info.CollectedObjects {
		counts[resource.GetKind()]++
	}
	kinds := make([]string, 0, len(counts))
	for kind := range counts {
		kinds = append(kinds, kind)
	}
	sort.Strings(kinds)
	resources := make([]migrationResourceCount, 0, len(kinds))
	for _, kind := range kinds {
		resources = append(resources, migrationResourceCount{Kind: kind, Count: counts[kind]})
	}

	actions := []string{
		fmt.Sprintf("Prepare install namespace %s. When it differs from the source namespace, copy the source Pod Security Admission (PSA) and security context constraint (SCC) labels, if the source namespace has them.", opts.InstallNamespace),
		fmt.Sprintf("Back up Subscription %s/%s and its OperatorGroup for rollback.", opts.SubscriptionNamespace, opts.SubscriptionName),
		fmt.Sprintf("Delete Subscription %s/%s and ClusterServiceVersion %s/%s without deleting the resources that they created.", opts.SubscriptionNamespace, opts.SubscriptionName, opts.SubscriptionNamespace, info.BundleName),
	}
	if opts.InstallNamespace != opts.SubscriptionNamespace {
		actions = append(actions, fmt.Sprintf("Scale source Deployments in %s to zero and wait for their Pods to terminate.", opts.SubscriptionNamespace))
	}
	actions = append(actions,
		fmt.Sprintf("Create ClusterObjectSet %s-1 and wait for its resources to become ready.", opts.ClusterExtensionName),
		fmt.Sprintf("Create ClusterExtension %s in namespace %s and wait until it is installed.", opts.ClusterExtensionName, opts.InstallNamespace),
		fmt.Sprintf("Delete the source copies of migrated resources. Clean up OLM (Classic) resources, including the Operator resource %s.%s and OperatorCondition %s/%s, if they exist.", info.PackageName, opts.SubscriptionNamespace, opts.SubscriptionNamespace, info.BundleName),
	)
	if opts.DeleteOperatorGroup {
		actions = append(actions, "Delete the OperatorGroup only if no Subscriptions remain in the source namespace.")
	}
	if opts.InstallNamespace != opts.SubscriptionNamespace && opts.AcknowledgeNamespaceDelete {
		actions = append(actions, fmt.Sprintf("Delete source namespace %s after successful migration.", opts.SubscriptionNamespace))
	} else if opts.InstallNamespace != opts.SubscriptionNamespace {
		actions = append(actions, fmt.Sprintf("Retain source namespace %s.", opts.SubscriptionNamespace))
	}

	return &operatorMigrationPlan{
		ClusterExtensionName: opts.ClusterExtensionName,
		InstallNamespace:     opts.InstallNamespace,
		PackageName:          info.PackageName,
		Version:              info.Version,
		Channel:              info.Channel,
		ClusterCatalog:       info.ResolvedCatalogName,
		ClusterObjectSetName: fmt.Sprintf("%s-1", opts.ClusterExtensionName),
		Resources:            resources,
		Actions:              actions,
	}
}

type operatorMigrationRollbackRequest struct {
	JobID                string `json:"jobID"`
	ClusterExtensionName string `json:"clusterExtensionName,omitempty"`
	ClusterObjectSetName string `json:"clusterObjectSetName,omitempty"`
	AcknowledgeInstalled bool   `json:"acknowledgeInstalled,omitempty"`
}

// migrationRollbackHandler requires explicit recovery acknowledgment before queuing rollback of an owned failed item.
func (o *OLMHandler) migrationRollbackHandler(w http.ResponseWriter, r *http.Request) {
	var request operatorMigrationRollbackRequest
	if err := decodeOperatorMigrationRequest(w, r, &request); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
		return
	}
	if request.JobID == "" || !request.AcknowledgeInstalled {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "jobID and explicit rollback acknowledgment are required"})
		return
	}
	if (request.ClusterExtensionName == "") == (request.ClusterObjectSetName == "") {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: "set exactly one of clusterExtensionName or clusterObjectSetName"})
		return
	}
	if request.ClusterExtensionName != "" {
		if err := validateMigrationName("clusterExtensionName", request.ClusterExtensionName, false); err != nil {
			serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
			return
		}
	} else if err := validateMigrationName("clusterObjectSetName", request.ClusterObjectSetName, false); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
		return
	}

	migrator, err := o.operatorMigrator(r)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	owner, err := o.migrationJobOwner(r)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	job, err := o.createRollbackJob(r.Context(), migrator, owner, request)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	serverutils.SendResponse(w, http.StatusAccepted, map[string]string{"jobID": job.ID, "status": job.Status})
}

type operatorMigrationCleanupRequest struct {
	ClusterExtensionName string `json:"clusterExtensionName"`
}

// migrationCleanupHandler removes an acknowledged management conflict using the requesting user's permissions.
func (o *OLMHandler) migrationCleanupHandler(w http.ResponseWriter, r *http.Request) {
	var request operatorMigrationCleanupRequest
	if err := decodeOperatorMigrationRequest(w, r, &request); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
		return
	}
	if err := validateMigrationName("clusterExtensionName", request.ClusterExtensionName, false); err != nil {
		serverutils.SendResponse(w, http.StatusBadRequest, serverutils.ApiError{Err: err.Error()})
		return
	}
	migrator, err := o.operatorMigrator(r)
	if err != nil {
		writeOperatorMigrationError(w, err)
		return
	}
	if err := migrator.CleanupConflict(r.Context(), request.ClusterExtensionName); err != nil {
		klog.Errorf("OLM migration cleanup failed: error category=%s", migrationErrorCategory(err))
		status := operatorMigrationErrorStatus(err)
		if status == http.StatusInternalServerError {
			status = http.StatusUnprocessableEntity
		}
		serverutils.SendResponse(w, status, serverutils.ApiError{Err: err.Error()})
		return
	}
	serverutils.SendResponse(w, http.StatusOK, map[string]string{
		"status":               "CleanedUp",
		"clusterExtensionName": request.ClusterExtensionName,
	})
}

// decodeOperatorMigrationRequest decodes one JSON request with a bounded body and rejects unknown fields.
func decodeOperatorMigrationRequest(w http.ResponseWriter, r *http.Request, request interface{}) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(request); err != nil {
		return fmt.Errorf("failed to parse request: %w", err)
	}
	if err := decoder.Decode(new(interface{})); err != io.EOF {
		return fmt.Errorf("request body must contain exactly one JSON document")
	}
	return nil
}

// migrationClientConfig preserves Console impersonation so Kubernetes checks the effective user's permissions.
func (o *OLMHandler) migrationClientConfig(r *http.Request) (*rest.Config, error) {
	config, err := o.getK8sClientConfig(r)
	if err != nil {
		return nil, err
	}
	config.Impersonate.UserName = r.Header.Get("Impersonate-User")
	config.Impersonate.UID = r.Header.Get("Impersonate-Uid")
	groups := append(r.Header.Values("Impersonate-Group"), strings.Split(r.Header.Get("X-Console-Impersonate-Groups"), ",")...)
	for _, group := range groups {
		if group = strings.TrimSpace(group); group != "" {
			config.Impersonate.Groups = append(config.Impersonate.Groups, group)
		}
	}
	if len(config.Impersonate.Groups) > 0 {
		config.Impersonate.Groups = append(config.Impersonate.Groups, "system:authenticated")
	}
	return config, nil
}

// newOperatorMigrator uses the request's Kubernetes credentials for migration and catalog port forwarding.
func (o *OLMHandler) newOperatorMigrator(r *http.Request) (*migration.Migrator, error) {
	config, err := o.migrationClientConfig(r)
	if err != nil {
		return nil, fmt.Errorf("failed to get Kubernetes client config: %w", err)
	}

	migrator, err := newMigrationClient(config)
	if err != nil {
		return nil, err
	}
	// Catalog port forwarding uses a separate transport.
	migrator.RESTConfig = &rest.Config{
		Host:            config.Host,
		Impersonate:     config.Impersonate,
		BearerToken:     config.BearerToken,
		TLSClientConfig: o.apiServerTLSConfig,
	}
	return migrator, nil
}

// newMigrationClient registers migration resource types and constructs a client from the supplied credentials.
func newMigrationClient(config *rest.Config) (*migration.Migrator, error) {
	scheme := runtime.NewScheme()
	for _, addToScheme := range []func(*runtime.Scheme) error{
		clientgoscheme.AddToScheme,
		ocv1.AddToScheme,
		appsv1.AddToScheme,
		corev1.AddToScheme,
		apiextensionsv1.AddToScheme,
		operatorsv1.AddToScheme,
		operatorsv1alpha1.AddToScheme,
	} {
		if err := addToScheme(scheme); err != nil {
			return nil, fmt.Errorf("failed to register Kubernetes scheme: %w", err)
		}
	}

	kubeClient, err := client.New(config, client.Options{Scheme: scheme})
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes client: %w", err)
	}
	return migration.NewMigrator(kubeClient, config), nil
}

// writeOperatorMigrationError returns a diagnostic API error with its mapped HTTP status.
func writeOperatorMigrationError(w http.ResponseWriter, err error) {
	if seconds, ok := apierrors.SuggestsClientDelay(err); ok {
		w.Header().Set("Retry-After", strconv.Itoa(seconds))
	}
	serverutils.SendResponse(w, operatorMigrationErrorStatus(err), serverutils.ApiError{Err: err.Error()})
}

// operatorMigrationErrorStatus maps Kubernetes errors to client, authorization, transient, or internal HTTP statuses.
func operatorMigrationErrorStatus(err error) int {
	switch {
	case apierrors.IsUnauthorized(err):
		return http.StatusUnauthorized
	case apierrors.IsForbidden(err):
		return http.StatusForbidden
	case apierrors.IsNotFound(err):
		return http.StatusNotFound
	case apierrors.IsConflict(err):
		return http.StatusConflict
	case apierrors.IsInvalid(err), apierrors.IsBadRequest(err):
		return http.StatusBadRequest
	case apierrors.IsTooManyRequests(err):
		return http.StatusTooManyRequests
	case apierrors.IsTimeout(err), apierrors.IsServerTimeout(err), apierrors.IsServiceUnavailable(err):
		return http.StatusServiceUnavailable
	default:
		return http.StatusInternalServerError
	}
}
