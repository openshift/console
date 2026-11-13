package olm

import (
	"context"
	"fmt"
	"strings"
	"time"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	admissionv1 "k8s.io/api/admissionregistration/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/equality"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/klog/v2"
	"k8s.io/utils/ptr"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// rollbackRevisionPolicyName versions both admission Specs. Change the suffix
// whenever either Spec changes; installed guards are never updated in place.
const rollbackRevisionPolicyName = "console-olm-migration-rollback-v2"
const rollbackRevisionPolicyMessage = "This migration job cannot delete revisions for another cluster extension. Check the selected operator before retrying rollback."

const rollbackRevisionTargetExpression = `
has(oldObject.spec) && has(oldObject.spec.group) && oldObject.spec.group != ''
  ? oldObject.spec.group
  : (has(oldObject.metadata.labels) &&
     'olm.operatorframework.io/owner-name' in oldObject.metadata.labels &&
     oldObject.metadata.labels['olm.operatorframework.io/owner-name'] != ''
      ? oldObject.metadata.labels['olm.operatorframework.io/owner-name']
      : (has(oldObject.metadata.name) && oldObject.metadata.name.endsWith('-1')
          ? oldObject.metadata.name.substring(0, size(oldObject.metadata.name) - 2)
          : ''))`

// rollbackRevisionPolicyObjects defines a persistent API-server boundary for future revision names.
// It has no job owner: namespace garbage collection must not remove enforcement
// while another job or a cached service-account token still has delete access.
func rollbackRevisionPolicyObjects() []client.Object {
	fail, equivalent, cluster := admissionv1.Fail, admissionv1.Equivalent, admissionv1.ClusterScope
	forbidden := metav1.StatusReasonForbidden
	return []client.Object{
		&admissionv1.ValidatingAdmissionPolicy{
			ObjectMeta: metav1.ObjectMeta{Name: rollbackRevisionPolicyName},
			Spec: admissionv1.ValidatingAdmissionPolicySpec{
				FailurePolicy: &fail,
				MatchConstraints: &admissionv1.MatchResources{
					MatchPolicy: &equivalent, NamespaceSelector: &metav1.LabelSelector{}, ObjectSelector: &metav1.LabelSelector{},
					ResourceRules: []admissionv1.NamedRuleWithOperations{{RuleWithOperations: admissionv1.RuleWithOperations{
						Operations: []admissionv1.OperationType{admissionv1.Delete},
						Rule:       admissionv1.Rule{APIGroups: []string{ocv1.GroupVersion.Group}, APIVersions: []string{ocv1.GroupVersion.Version}, Resources: []string{"clusterobjectsets"}, Scope: &cluster},
					}}},
				},
				MatchConditions: []admissionv1.MatchCondition{{Name: "migration-service-account", Expression: "request.userInfo.username.startsWith('system:serviceaccount:" + migrationJobNamespacePrefix + "') && request.userInfo.username.endsWith(':" + migrationJobStateName + "')"}},
				Variables:       []admissionv1.Variable{{Name: "target", Expression: rollbackRevisionTargetExpression}},
				Validations:     []admissionv1.Validation{{Expression: "variables.target != '' && authorizer.group('olm.operatorframework.io').resource('clusterextensions').name(variables.target).check('delete').allowed()", Message: rollbackRevisionPolicyMessage, Reason: &forbidden}},
			},
		},
		&admissionv1.ValidatingAdmissionPolicyBinding{
			ObjectMeta: metav1.ObjectMeta{Name: rollbackRevisionPolicyName},
			Spec: admissionv1.ValidatingAdmissionPolicyBindingSpec{
				PolicyName: rollbackRevisionPolicyName, ValidationActions: []admissionv1.ValidationAction{admissionv1.Deny},
			},
		},
	}
}

// requireRollbackRevisionPolicy refuses missing, deleting, or modified enforcement objects.
func requireRollbackRevisionPolicy(ctx context.Context, kubeClient client.Client) error {
	for _, expected := range rollbackRevisionPolicyObjects() {
		actual := expected.DeepCopyObject().(client.Object)
		if err := kubeClient.Get(ctx, client.ObjectKeyFromObject(expected), actual); err != nil {
			return fmt.Errorf("Cannot read the rollback revision admission guard. Check admission policy read permissions, then retry rollback: %w", err)
		}
		if actual.GetDeletionTimestamp() != nil {
			return fmt.Errorf("Deletion of the rollback revision admission guard is in progress. Wait for deletion to finish, then retry rollback to install the guard again.")
		}
		if len(actual.GetOwnerReferences()) != 0 {
			return fmt.Errorf("The rollback revision admission guard has an owner that could remove it. Ask a cluster administrator to install a persistent guard before retrying rollback.")
		}
		matches := false
		switch desired := expected.(type) {
		case *admissionv1.ValidatingAdmissionPolicy:
			current := actual.(*admissionv1.ValidatingAdmissionPolicy).Spec
			matches = current.ParamKind == nil && len(current.AuditAnnotations) == 0 &&
				ptr.Deref(current.FailurePolicy, admissionv1.Fail) == admissionv1.Fail &&
				rollbackPolicyMatchesResources(desired.Spec.MatchConstraints, current.MatchConstraints) &&
				equality.Semantic.DeepEqual(desired.Spec.MatchConditions, current.MatchConditions) &&
				equality.Semantic.DeepEqual(desired.Spec.Variables, current.Variables) &&
				equality.Semantic.DeepEqual(desired.Spec.Validations, current.Validations)
		case *admissionv1.ValidatingAdmissionPolicyBinding:
			current := actual.(*admissionv1.ValidatingAdmissionPolicyBinding).Spec
			matches = current.PolicyName == desired.Spec.PolicyName && current.ParamRef == nil &&
				rollbackPolicyMatchesResources(desired.Spec.MatchResources, current.MatchResources) &&
				equality.Semantic.DeepEqual(desired.Spec.ValidationActions, current.ValidationActions)
		}
		if !matches {
			return fmt.Errorf("The rollback revision admission guard has an unexpected configuration. Ask a cluster administrator to verify the guard before retrying rollback.")
		}
	}
	return nil
}

// rollbackPolicyMatchesResources accepts API defaults while rejecting selectors, exclusions, or rules that weaken coverage.
func rollbackPolicyMatchesResources(desired, current *admissionv1.MatchResources) bool {
	if desired == nil {
		desired = &admissionv1.MatchResources{}
	}
	if current == nil {
		current = &admissionv1.MatchResources{}
	}
	selector := func(value *metav1.LabelSelector) *metav1.LabelSelector {
		if value == nil {
			return &metav1.LabelSelector{}
		}
		return value
	}
	return ptr.Deref(desired.MatchPolicy, admissionv1.Equivalent) == ptr.Deref(current.MatchPolicy, admissionv1.Equivalent) &&
		equality.Semantic.DeepEqual(selector(desired.NamespaceSelector), selector(current.NamespaceSelector)) &&
		equality.Semantic.DeepEqual(selector(desired.ObjectSelector), selector(current.ObjectSelector)) &&
		equality.Semantic.DeepEqual(desired.ResourceRules, current.ResourceRules) &&
		equality.Semantic.DeepEqual(desired.ExcludeResourceRules, current.ExcludeResourceRules)
}

// ensureRollbackRevisionPolicy installs the fixed guard using the caller's authorization, never backend credentials.
func ensureRollbackRevisionPolicy(ctx context.Context, kubeClient client.Client) error {
	for _, object := range rollbackRevisionPolicyObjects() {
		current := object.DeepCopyObject().(client.Object)
		if err := kubeClient.Get(ctx, client.ObjectKeyFromObject(object), current); apierrors.IsNotFound(err) {
			if err := kubeClient.Create(ctx, object); err != nil && !apierrors.IsAlreadyExists(err) {
				return fmt.Errorf("Cannot install the rollback revision admission guard. Ask a cluster administrator to check your admission policy create permissions, then retry rollback: %w", err)
			}
		} else if err != nil {
			return fmt.Errorf("Cannot read the rollback revision admission guard. Check admission policy read permissions, then retry rollback: %w", err)
		}
	}
	return requireRollbackRevisionPolicy(ctx, kubeClient)
}

// verifyRollbackRevisionPolicy waits for admission and RBAC propagation before a job becomes discoverable.
// The empty probe manages no workloads, and every worker delete is a server-side dry run.
// If caller cleanup is forbidden, its Namespace owner reference permits garbage collection at job cleanup.
func verifyRollbackRevisionPolicy(ctx context.Context, caller, worker client.Client, namespace *corev1.Namespace) error {
	probe := &ocv1.ClusterObjectSet{
		ObjectMeta: metav1.ObjectMeta{OwnerReferences: []metav1.OwnerReference{{APIVersion: "v1", Kind: "Namespace", Name: namespace.Name, UID: namespace.UID}}},
		Spec: ocv1.ClusterObjectSetSpec{
			Group:               "rollback-probe-" + strings.TrimPrefix(namespace.Name, migrationJobNamespacePrefix),
			Revision:            1,
			LifecycleState:      ocv1.ClusterObjectSetLifecycleStateActive,
			CollisionProtection: ocv1.CollisionProtectionPrevent,
			Phases:              []ocv1.ClusterObjectSetPhase{{Name: "probe", Objects: []ocv1.ClusterObjectSetObject{}}},
		},
	}
	probe.Name = fmt.Sprintf("%s-%d", probe.Spec.Group, probe.Spec.Revision)
	if err := caller.Create(ctx, probe); err != nil {
		return fmt.Errorf("Cannot create the rollback admission probe. Check ClusterObjectSet create permissions, then retry rollback: %w", err)
	}
	defer func() {
		cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 10*time.Second)
		defer cancel()
		if err := caller.Delete(cleanupCtx, probe, client.Preconditions{UID: &probe.UID}, client.PropagationPolicy(metav1.DeletePropagationOrphan)); client.IgnoreNotFound(err) != nil {
			klog.Warningf("OLM rollback admission probe %s cleanup failed: error category=%s. Namespace garbage collection removes the empty probe at job cleanup. Ask a cluster administrator to investigate if the probe remains after cleanup.", probe.Name, migrationErrorCategory(err))
		}
	}()
	return wait.PollUntilContextTimeout(ctx, 250*time.Millisecond, 30*time.Second, true, func(ctx context.Context) (bool, error) {
		if err := requireRollbackRevisionPolicy(ctx, caller); err != nil {
			return false, err
		}
		err := worker.Delete(ctx, probe, client.DryRunAll, client.Preconditions{UID: &probe.UID}, client.PropagationPolicy(metav1.DeletePropagationOrphan))
		if apierrors.IsForbidden(err) {
			return strings.Contains(err.Error(), rollbackRevisionPolicyName) && strings.Contains(err.Error(), rollbackRevisionPolicyMessage), nil
		}
		return false, err // Success means admission has not propagated; retry without deleting anything.
	})
}
