package olm

import (
	"context"
	"fmt"
	"reflect"
	"strings"
	"time"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	admissionv1 "k8s.io/api/admissionregistration/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/wait"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const rollbackRevisionPolicyName = "console-olm-migration-rollback-v1"
const rollbackRevisionPolicyMessage = "revision group is outside this migration's delegated target"

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
			return fmt.Errorf("read rollback revision admission guard: %w", err)
		}
		if actual.GetDeletionTimestamp() != nil || len(actual.GetOwnerReferences()) != 0 {
			return fmt.Errorf("rollback revision admission guard is being removed")
		}
		matches := false
		switch desired := expected.(type) {
		case *admissionv1.ValidatingAdmissionPolicy:
			matches = reflect.DeepEqual(desired.Spec, actual.(*admissionv1.ValidatingAdmissionPolicy).Spec)
		case *admissionv1.ValidatingAdmissionPolicyBinding:
			matches = reflect.DeepEqual(desired.Spec, actual.(*admissionv1.ValidatingAdmissionPolicyBinding).Spec)
		}
		if !matches {
			return fmt.Errorf("rollback revision admission guard has an unexpected configuration")
		}
	}
	return nil
}

// ensureRollbackRevisionPolicy installs the fixed guard using the caller's authorization, never backend credentials.
func ensureRollbackRevisionPolicy(ctx context.Context, kubeClient client.Client) error {
	for _, object := range rollbackRevisionPolicyObjects() {
		current := object.DeepCopyObject().(client.Object)
		if err := kubeClient.Get(ctx, client.ObjectKeyFromObject(object), current); apierrors.IsNotFound(err) {
			if err := kubeClient.Create(ctx, object); err != nil && !apierrors.IsAlreadyExists(err) {
				return fmt.Errorf("install rollback revision admission guard: %w", err)
			}
		} else if err != nil {
			return fmt.Errorf("read rollback revision admission guard: %w", err)
		}
	}
	return requireRollbackRevisionPolicy(ctx, kubeClient)
}

// verifyRollbackRevisionPolicy waits for admission and RBAC propagation before a job becomes discoverable.
// The empty probe manages no workloads, and every worker delete is a server-side dry run.
func verifyRollbackRevisionPolicy(ctx context.Context, caller, worker client.Client, namespace *corev1.Namespace) error {
	probe := &ocv1.ClusterObjectSet{
		ObjectMeta: metav1.ObjectMeta{Name: namespace.Name + "-probe", OwnerReferences: []metav1.OwnerReference{{APIVersion: "v1", Kind: "Namespace", Name: namespace.Name, UID: namespace.UID}}},
		Spec:       ocv1.ClusterObjectSetSpec{Group: "rollback-probe-" + strings.TrimPrefix(namespace.Name, migrationJobNamespacePrefix), Revision: 1, LifecycleState: ocv1.ClusterObjectSetLifecycleStateActive, CollisionProtection: ocv1.CollisionProtectionPrevent},
	}
	if err := caller.Create(ctx, probe); err != nil {
		return fmt.Errorf("create rollback admission probe: %w", err)
	}
	defer func() {
		cleanupCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 10*time.Second)
		defer cancel()
		_ = caller.Delete(cleanupCtx, probe, client.Preconditions{UID: &probe.UID}, client.PropagationPolicy(metav1.DeletePropagationOrphan))
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
