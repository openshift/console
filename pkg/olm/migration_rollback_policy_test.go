package olm

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/google/cel-go/cel"
	"github.com/google/cel-go/common/types"
	"github.com/google/cel-go/common/types/ref"
	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	"github.com/operator-framework/library-olm/migration/pkg/migration"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	admissionv1 "k8s.io/api/admissionregistration/v1"
	corev1 "k8s.io/api/core/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/klog/v2"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/client/interceptor"

	"github.com/openshift/console/pkg/auth"
)

// TestRollbackRevisionPolicyVersion pins both v2 Specs so changing enforcement requires a new shared name.
func TestRollbackRevisionPolicyVersion(t *testing.T) {
	objects := rollbackRevisionPolicyObjects()
	policy := objects[0].(*admissionv1.ValidatingAdmissionPolicy)
	binding := objects[1].(*admissionv1.ValidatingAdmissionPolicyBinding)
	require.Equal(t, "console-olm-migration-rollback-v2", policy.Name)
	require.Equal(t, policy.Name, binding.Name)
	require.Equal(t, policy.Name, binding.Spec.PolicyName)
	specs, err := json.Marshal([]interface{}{policy.Spec, binding.Spec})
	require.NoError(t, err)
	assert.Equal(t, "45e827343ffe275dcb69b0ff7416f0805f554a665f7daee6061a12d1093dc379", fmt.Sprintf("%x", sha256.Sum256(specs)), "version the policy name when either admission Spec changes")
}

// TestRollbackProbeCleanupLogsRedactedFailures reports cleanup problems without logging customer-controlled error data.
func TestRollbackProbeCleanupLogsRedactedFailures(t *testing.T) {
	for _, tt := range []struct {
		name, category string
		err            error
	}{
		{name: "success"},
		{name: "already removed", err: apierrors.NewNotFound(ocv1.GroupVersion.WithResource("clusterobjectsets").GroupResource(), "probe")},
		{name: "forbidden", category: "forbidden", err: apierrors.NewForbidden(ocv1.GroupVersion.WithResource("clusterobjectsets").GroupResource(), "customer-resource", errors.New("https://user:password@private.example?token=secret"))},
		{name: "timeout", category: "timeout", err: context.DeadlineExceeded},
		{name: "unprintable", category: "unexpected", err: migrationUnprintableError{}},
	} {
		t.Run(tt.name, func(t *testing.T) {
			state := klog.CaptureState()
			defer state.Restore()
			var output bytes.Buffer
			klog.SetOutput(&output)
			klog.LogToStderr(false)
			kubeClient := newMigrationTestClient(t, rollbackRevisionPolicyObjects()...)
			caller := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.DeleteOption) error {
				if tt.err != nil {
					return tt.err
				}
				return cl.Delete(ctx, object, options...)
			}})
			worker := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(context.Context, client.WithWatch, client.Object, ...client.DeleteOption) error {
				return apierrors.NewForbidden(ocv1.GroupVersion.WithResource("clusterobjectsets").GroupResource(), "probe", errors.New(rollbackRevisionPolicyName+": "+rollbackRevisionPolicyMessage))
			}})
			namespace := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: migrationJobNamespacePrefix + "0123456789abcdef0123456789abcdef", UID: "namespace-uid"}}
			require.NoError(t, verifyRollbackRevisionPolicy(context.Background(), caller, worker, namespace))
			klog.Flush()
			if tt.category == "" {
				assert.Empty(t, output.String())
			} else {
				assert.Contains(t, output.String(), "OLM rollback admission probe rollback-probe-0123456789abcdef0123456789abcdef-1 cleanup failed: error category="+tt.category)
				assert.Contains(t, output.String(), "Ask a cluster administrator to investigate if the probe remains after cleanup.")
				assert.True(t, strings.HasPrefix(output.String(), "W"), "cleanup errors must be warnings")
			}
			for _, sensitive := range []string{"customer-resource", "private.example", "password", "token=secret"} {
				assert.NotContains(t, output.String(), sensitive)
			}
			if tt.category != "" {
				var probes ocv1.ClusterObjectSetList
				require.NoError(t, kubeClient.List(context.Background(), &probes))
				require.Len(t, probes.Items, 1)
				assert.Equal(t, []metav1.OwnerReference{{APIVersion: "v1", Kind: "Namespace", Name: namespace.Name, UID: namespace.UID}}, probes.Items[0].OwnerReferences, "failed direct cleanup must retain the namespace GC fallback")
			}
		})
	}
}

// TestRollbackRevisionPolicyDefaults accepts equivalent defaulted and empty representations without changing installed Specs.
func TestRollbackRevisionPolicyDefaults(t *testing.T) {
	objects := rollbackRevisionPolicyObjects()
	policy := objects[0].(*admissionv1.ValidatingAdmissionPolicy)
	policy.Spec.FailurePolicy = nil // Defaults to Fail.
	policy.Spec.AuditAnnotations = []admissionv1.AuditAnnotation{}
	policy.Spec.MatchConstraints.MatchPolicy = nil // Defaults to Equivalent.
	policy.Spec.MatchConstraints.NamespaceSelector = nil
	policy.Spec.MatchConstraints.ObjectSelector = &metav1.LabelSelector{MatchLabels: map[string]string{}, MatchExpressions: []metav1.LabelSelectorRequirement{}}
	policy.Spec.MatchConstraints.ExcludeResourceRules = []admissionv1.NamedRuleWithOperations{}
	policy.Spec.MatchConstraints.ResourceRules[0].ResourceNames = []string{}
	binding := objects[1].(*admissionv1.ValidatingAdmissionPolicyBinding)
	equivalent := admissionv1.Equivalent
	binding.Spec.MatchResources = &admissionv1.MatchResources{
		MatchPolicy: &equivalent, NamespaceSelector: &metav1.LabelSelector{}, ObjectSelector: &metav1.LabelSelector{},
	}
	kubeClient := newMigrationTestClient(t, objects...)
	require.NoError(t, requireRollbackRevisionPolicy(context.Background(), kubeClient))
	require.NoError(t, ensureRollbackRevisionPolicy(context.Background(), kubeClient))
	var actual admissionv1.ValidatingAdmissionPolicy
	require.NoError(t, kubeClient.Get(context.Background(), client.ObjectKey{Name: policy.Name}, &actual))
	assert.Nil(t, actual.Spec.FailurePolicy, "verification must not rewrite an installed policy")
}

// TestRollbackPolicySetupDeniedDoesNotPublishWork refuses recovery before allocating execution credentials if the caller cannot install enforcement.
func TestRollbackPolicySetupDeniedDoesNotPublishWork(t *testing.T) {
	ctx := context.Background()
	kubeClient, source, _, snapshot := seedFailedRollback(t)
	require.NoError(t, kubeClient.Create(ctx, &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: snapshot.ClusterExtensionName}}))
	var before corev1.NamespaceList
	require.NoError(t, kubeClient.List(ctx, &before))
	caller := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Create: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.CreateOption) error {
		if _, ok := object.(*admissionv1.ValidatingAdmissionPolicy); ok {
			return apierrors.NewForbidden(schema.GroupResource{Group: admissionv1.GroupName, Resource: "validatingadmissionpolicies"}, object.GetName(), errors.New("not authorized to install admission policy"))
		}
		if _, account := object.(*corev1.ServiceAccount); account {
			t.Fatal("must not allocate a worker before enforcement can be installed")
		}
		return cl.Create(ctx, object, options...)
	}})
	body, err := json.Marshal(operatorMigrationRollbackRequest{JobID: source.ID, ClusterExtensionName: snapshot.ClusterExtensionName, AcknowledgeInstalled: true})
	require.NoError(t, err)
	request := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(string(body))).WithContext(context.WithValue(ctx, auth.UserContextKey, &auth.User{ID: "alice"}))
	response := httptest.NewRecorder()
	newMigrationTestHandler(caller).migrationRollbackHandler(response, request)
	require.Equal(t, http.StatusForbidden, response.Code, response.Body.String())
	var after corev1.NamespaceList
	require.NoError(t, kubeClient.List(ctx, &after))
	// Source namespace preparation is idempotent, but no execution namespace or index is published.
	for _, namespace := range after.Items {
		if strings.HasPrefix(namespace.Name, migrationJobNamespacePrefix) {
			assert.True(t, slices.ContainsFunc(before.Items, func(existing corev1.Namespace) bool { return existing.Name == namespace.Name }))
		}
	}
}

// TestRollbackRevisionPolicyExpressions evaluates the actual CEL keys and parent-authorization request independently of Console's deletion guard.
func TestRollbackRevisionPolicyExpressions(t *testing.T) {
	policy := rollbackRevisionPolicyObjects()[0].(*admissionv1.ValidatingAdmissionPolicy)
	options := []cel.EnvOption{cel.Variable("oldObject", cel.DynType), cel.Variable("request", cel.DynType), cel.Variable("variables", cel.DynType), cel.Variable("authorizer", cel.StringType)}
	// Kubernetes enables the CEL strings extension. Use its ASCII substring
	// signature here without adding that otherwise unused package to vendor.
	options = append(options, cel.Function("substring", cel.MemberOverload("rollback_substring", []*cel.Type{cel.StringType, cel.IntType, cel.IntType}, cel.StringType, cel.FunctionBinding(func(args ...ref.Val) ref.Val {
		return types.String(string(args[0].(types.String))[int(args[1].(types.Int)):int(args[2].(types.Int))])
	}))))
	// Record the resource check built by the policy. The API-server integration
	// uses Kubernetes' real CEL authorizer; this unit test pins the requested
	// group, resource, exact target name, and verb without a control plane.
	for _, method := range []string{"group", "resource", "name", "check"} {
		options = append(options, cel.Function(method, cel.MemberOverload("rollback_"+method, []*cel.Type{cel.StringType, cel.StringType}, cel.StringType, cel.BinaryBinding(func(receiver, argument ref.Val) ref.Val {
			return types.String(string(receiver.(types.String)) + "|" + string(argument.(types.String)))
		}))))
	}
	options = append(options, cel.Function("allowed", cel.MemberOverload("rollback_allowed", []*cel.Type{cel.StringType}, cel.BoolType, cel.UnaryBinding(func(check ref.Val) ref.Val {
		return types.Bool(check == types.String("|olm.operatorframework.io|clusterextensions|demo|delete"))
	}))))
	env, err := cel.NewEnv(options...)
	require.NoError(t, err)
	compile := func(expression string) cel.Program {
		ast, issues := env.Compile(expression)
		require.NoError(t, issues.Err())
		program, err := env.Program(ast)
		require.NoError(t, err)
		return program
	}
	target, validate := compile(policy.Spec.Variables[0].Expression), compile(policy.Spec.Validations[0].Expression)
	for _, tt := range []struct {
		name, group, label, objectName string
		allowed                        bool
	}{
		{name: "target revision", group: "demo", allowed: true},
		{name: "foreign group", group: "other"},
		{name: "misleading label", group: "other", label: "demo"},
		{name: "legacy target", label: "demo", allowed: true},
		{name: "legacy foreign target", label: "other"},
		{name: "unlabeled legacy initial revision", objectName: "demo-1", allowed: true},
		{name: "foreign legacy initial revision", objectName: "other-1"},
		{name: "misleading initial name", objectName: "demo-1", group: "other"},
		{name: "missing group and label"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			object := map[string]interface{}{"metadata": map[string]interface{}{}}
			if tt.objectName != "" {
				object["metadata"].(map[string]interface{})["name"] = tt.objectName
			}
			if tt.group != "" {
				object["spec"] = map[string]interface{}{"group": tt.group}
			}
			if tt.label != "" {
				object["metadata"].(map[string]interface{})["labels"] = map[string]interface{}{migration.LabelOwnerName: tt.label}
			}
			value, _, err := target.Eval(map[string]interface{}{"oldObject": object})
			require.NoError(t, err)
			result, _, err := validate.Eval(map[string]interface{}{"variables": map[string]interface{}{"target": value.Value()}, "authorizer": ""})
			require.NoError(t, err)
			assert.Equal(t, tt.allowed, result.Value())
		})
	}
	match := compile(policy.Spec.MatchConditions[0].Expression)
	for _, tt := range []struct {
		username string
		matches  bool
	}{
		{username: "system:serviceaccount:" + migrationJobNamespacePrefix + "job:" + migrationJobStateName, matches: true},
		{username: "system:serviceaccount:other:migration"},
		{username: "system:serviceaccount:" + migrationJobNamespacePrefix + "job:other"},
		{username: "cluster-admin"},
	} {
		result, _, err := match.Eval(map[string]interface{}{"request": map[string]interface{}{"userInfo": map[string]interface{}{"username": tt.username}}})
		require.NoError(t, err)
		assert.Equal(t, tt.matches, result.Value(), tt.username)
	}
}

// TestRollbackDeletesLaterRevisions uses the original delegated grants after a controller adds a revision, including after restart.
func TestRollbackDeletesLaterRevisions(t *testing.T) {
	for _, restart := range []bool{false, true} {
		t.Run(fmt.Sprintf("restart=%t", restart), func(t *testing.T) {
			ctx := context.Background()
			kubeClient, source, checkpoint, snapshot := seedFailedRollback(t)
			snapshot.UseClusterObjectDeployment = true
			snapshot.InstalledCSV, snapshot.InstalledCSVUID = "demo.v1", "csv-uid"
			require.NoError(t, kubeClient.Create(ctx, &operatorsv1alpha1.ClusterServiceVersion{ObjectMeta: metav1.ObjectMeta{Name: snapshot.InstalledCSV, Namespace: "operators", UID: snapshot.InstalledCSVUID}, Status: operatorsv1alpha1.ClusterServiceVersionStatus{Phase: operatorsv1alpha1.CSVPhaseSucceeded}}))
			annotations := map[string]string{migrationExecutionAnnotation: source.ID, migration.MigratedFromSubscriptionAnnotation: snapshot.SubscriptionRef}
			extension := &ocv1.ClusterExtension{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "extension-uid", Annotations: annotations}}
			require.NoError(t, kubeClient.Create(ctx, extension))
			deployment := &ocv1.ClusterObjectDeployment{ObjectMeta: metav1.ObjectMeta{Name: "demo", UID: "deployment-uid", Annotations: annotations, OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(extension, ocv1.GroupVersion.WithKind(ocv1.ClusterExtensionKind))}}}
			require.NoError(t, kubeClient.Create(ctx, deployment))
			rollback := &operatorMigrationRollbackJob{SourceJobID: source.ID, CheckpointName: checkpoint.Name, CheckpointNamespace: checkpoint.Namespace, CheckpointUID: checkpoint.UID, Snapshot: *snapshot}
			permissions, err := prepareRollbackExecutionPermissions(ctx, kubeClient, rollback, "rollback-job")
			require.NoError(t, err)
			require.True(t, rollback.RevisionPolicy)
			require.NoError(t, ensureRollbackRevisionPolicy(ctx, kubeClient))
			var rules []rbacv1.PolicyRule
			for _, object := range permissions {
				if role, ok := object.(*rbacv1.ClusterRole); ok {
					rules = append(rules, role.Rules...)
				}
			}
			// This name did not exist at permission setup. The controller, rather
			// than Console, creates it without an execution annotation.
			revision := &ocv1.ClusterObjectSet{ObjectMeta: metav1.ObjectMeta{Name: "demo-2", UID: "revision-uid", OwnerReferences: []metav1.OwnerReference{*metav1.NewControllerRef(deployment, ocv1.GroupVersion.WithKind(ocv1.ClusterObjectDeploymentKind))}}, Spec: ocv1.ClusterObjectSetSpec{Group: "demo"}}
			require.NoError(t, kubeClient.Create(ctx, revision))
			interrupted := errors.New("backend stopped before revision deletion")
			runner := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Delete: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.DeleteOption) error {
				if revision, ok := object.(*ocv1.ClusterObjectSet); ok {
					allowed := false
					for _, rule := range rules {
						if slices.Contains(rule.Resources, "clusterobjectsets") && slices.Contains(rule.Verbs, "delete") && (len(rule.ResourceNames) == 0 || slices.Contains(rule.ResourceNames, revision.Name)) {
							allowed = true
						}
					}
					if !allowed {
						return apierrors.NewForbidden(schema.GroupResource{Group: ocv1.GroupVersion.Group, Resource: "clusterobjectsets"}, revision.Name, errors.New("not delegated"))
					}
					if restart {
						restart = false
						return interrupted
					}
				}
				return cl.Delete(ctx, object, options...)
			}})
			guard := rollbackTestGuard(t, runner, source.ID)
			err = executeRollback(ctx, guard, rollback, func() error { rollback.Restored = true; return nil })
			if errors.Is(err, interrupted) {
				// Only persisted state and the original RBAC grants are reused.
				var saved operatorMigrationRollbackJob
				data, encodeErr := encodeMigrationState(rollback)
				require.NoError(t, encodeErr)
				require.NoError(t, decodeMigrationState(data, &saved))
				replacement := rollbackTestGuard(t, runner, source.ID)
				err = executeRollback(ctx, replacement, &saved, func() error { saved.Restored = true; return nil })
			}
			require.NoError(t, err)
			assert.True(t, apierrors.IsNotFound(kubeClient.Get(ctx, client.ObjectKeyFromObject(revision), &ocv1.ClusterObjectSet{})))
			require.NoError(t, kubeClient.Get(ctx, client.ObjectKey{Name: "demo", Namespace: "operators"}, &operatorsv1alpha1.Subscription{}))
		})
	}
}

// TestRollbackRevisionPolicyRejectsModifiedGuard protects against unavailable or weakened API-server enforcement.
func TestRollbackRevisionPolicyRejectsModifiedGuard(t *testing.T) {
	for _, tt := range []struct {
		name   string
		change func([]client.Object) []client.Object
	}{
		{name: "unchanged"},
		{name: "missing policy", change: func(objects []client.Object) []client.Object { return objects[1:] }},
		{name: "missing binding", change: func(objects []client.Object) []client.Object { return objects[:1] }},
		{name: "audit only", change: func(objects []client.Object) []client.Object {
			objects[1].(*admissionv1.ValidatingAdmissionPolicyBinding).Spec.ValidationActions = []admissionv1.ValidationAction{admissionv1.Audit}
			return objects
		}},
		{name: "ignore failures", change: func(objects []client.Object) []client.Object {
			ignore := admissionv1.Ignore
			objects[0].(*admissionv1.ValidatingAdmissionPolicy).Spec.FailurePolicy = &ignore
			return objects
		}},
		{name: "skip workers", change: func(objects []client.Object) []client.Object {
			objects[0].(*admissionv1.ValidatingAdmissionPolicy).Spec.MatchConditions[0].Expression = "false"
			return objects
		}},
		{name: "binding selector", change: func(objects []client.Object) []client.Object {
			objects[1].(*admissionv1.ValidatingAdmissionPolicyBinding).Spec.MatchResources = &admissionv1.MatchResources{ObjectSelector: &metav1.LabelSelector{MatchLabels: map[string]string{"skip": "workers"}}}
			return objects
		}},
		{name: "excluded revisions", change: func(objects []client.Object) []client.Object {
			policy := objects[0].(*admissionv1.ValidatingAdmissionPolicy)
			policy.Spec.MatchConstraints.ExcludeResourceRules = policy.Spec.MatchConstraints.ResourceRules
			return objects
		}},
		{name: "no revision rules", change: func(objects []client.Object) []client.Object {
			objects[0].(*admissionv1.ValidatingAdmissionPolicy).Spec.MatchConstraints.ResourceRules = nil
			return objects
		}},
		{name: "different binding", change: func(objects []client.Object) []client.Object {
			objects[1].(*admissionv1.ValidatingAdmissionPolicyBinding).Spec.PolicyName = "other"
			return objects
		}},
		{name: "job owned", change: func(objects []client.Object) []client.Object {
			objects[0].SetOwnerReferences([]metav1.OwnerReference{{APIVersion: "v1", Kind: "Namespace", Name: "job", UID: "job-uid"}})
			return objects
		}},
		{name: "deletion in progress", change: func(objects []client.Object) []client.Object {
			now := metav1.Now()
			objects[0].SetDeletionTimestamp(&now)
			objects[0].SetFinalizers([]string{"test-finalizer"})
			return objects
		}},
	} {
		t.Run(tt.name, func(t *testing.T) {
			objects := rollbackRevisionPolicyObjects()
			if tt.change != nil {
				objects = tt.change(objects)
			}
			kubeClient := newMigrationTestClient(t, objects...)
			err := requireRollbackRevisionPolicy(context.Background(), kubeClient)
			if tt.change == nil {
				require.NoError(t, err)
				require.NoError(t, ensureRollbackRevisionPolicy(context.Background(), kubeClient))
			} else {
				require.Error(t, err)
				if tt.name == "deletion in progress" {
					require.ErrorContains(t, err, "Wait for deletion to finish")
				}
				if tt.name == "job owned" {
					require.ErrorContains(t, err, "install a persistent guard")
				}
				guard := rollbackTestGuard(t, kubeClient, "source-job")
				err = executeRollback(context.Background(), guard, &operatorMigrationRollbackJob{RevisionPolicy: true}, func() error { t.Fatal("must not restore without enforcement"); return nil })
				require.ErrorContains(t, err, "admission guard")
			}
		})
	}
}

// TestRollbackRevisionPolicyProbe waits for an admission denial, never mistaking RBAC propagation or an allowed dry run for enforcement.
func TestRollbackRevisionPolicyProbe(t *testing.T) {
	for _, enforced := range []bool{false, true} {
		t.Run(fmt.Sprintf("enforced=%t", enforced), func(t *testing.T) {
			kubeClient := newMigrationTestClient(t, rollbackRevisionPolicyObjects()...)
			caller := interceptor.NewClient(kubeClient.(client.WithWatch), interceptor.Funcs{Create: func(ctx context.Context, cl client.WithWatch, object client.Object, options ...client.CreateOption) error {
				probe, ok := object.(*ocv1.ClusterObjectSet)
				require.True(t, ok)
				require.Equal(t, fmt.Sprintf("%s-%d", probe.Spec.Group, probe.Spec.Revision), probe.Name, "the probe must satisfy ClusterObjectSet CRD name validation")
				return cl.Create(ctx, object, options...)
			}})
			attempts := 0
			worker := interceptor.NewClient(caller.(client.WithWatch), interceptor.Funcs{Delete: func(_ context.Context, _ client.WithWatch, object client.Object, options ...client.DeleteOption) error {
				assert.Equal(t, []string{metav1.DryRunAll}, (&client.DeleteOptions{}).ApplyOptions(options).DryRun)
				attempts++
				if !enforced || attempts == 1 {
					return nil
				}
				message := "RBAC has not propagated"
				if attempts >= 3 {
					message = rollbackRevisionPolicyName + ": " + rollbackRevisionPolicyMessage
				}
				return apierrors.NewForbidden(ocv1.GroupVersion.WithResource("clusterobjectsets").GroupResource(), object.GetName(), errors.New(message))
			}})
			duration := 30 * time.Millisecond
			if enforced {
				duration = 2 * time.Second
			}
			ctx, cancel := context.WithTimeout(context.Background(), duration)
			defer cancel()
			namespace := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: migrationJobNamespacePrefix + "0123456789abcdef0123456789abcdef", UID: "namespace-uid"}}
			err := verifyRollbackRevisionPolicy(ctx, caller, worker, namespace)
			if enforced {
				require.NoError(t, err)
				assert.Equal(t, 3, attempts)
			} else {
				require.ErrorIs(t, err, context.DeadlineExceeded)
			}
			var revisions ocv1.ClusterObjectSetList
			require.NoError(t, caller.List(context.Background(), &revisions))
			assert.Empty(t, revisions.Items, "the empty probe must be removed even when setup is cancelled")
		})
	}
}
