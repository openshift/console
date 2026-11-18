package migration

import (
	"context"
	"encoding/json"
	"fmt"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"sigs.k8s.io/controller-runtime/pkg/client"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
)

// collectRollbackResources recovers identities recorded before rollback orphaned
// catalog-generated resources, which need not appear in OLMv0's InstallPlan.
func (m *Migrator) collectRollbackResources(ctx context.Context, opts Options, seen map[string]bool) ([]unstructured.Unstructured, error) {
	var sub operatorsv1alpha1.Subscription
	if err := m.Client.Get(ctx, client.ObjectKey{Namespace: opts.SubscriptionNamespace, Name: opts.SubscriptionName}, &sub); err != nil {
		return nil, client.IgnoreNotFound(err)
	}
	encoded := sub.Annotations[rollbackReleaseSnapshotAnnotation]
	if encoded == "" {
		return nil, nil
	}
	var snapshot []rollbackObject
	if err := json.Unmarshal([]byte(encoded), &snapshot); err != nil {
		return nil, fmt.Errorf("decode rollback resource identities: %w", err)
	}
	var result []unstructured.Unstructured
	for _, saved := range snapshot {
		obj := saved.Identity.DeepCopy()
		if seen[resourceKey(*obj)] {
			continue
		}
		if saved.UID == "" || obj.GetName() == "" || obj.GetAPIVersion() == "" || obj.GetKind() == "" || olmv0OnlyKinds[obj.GetKind()] {
			return nil, fmt.Errorf("invalid rollback resource identity: %s", resourceKey(*obj))
		}
		if err := m.Client.Get(ctx, client.ObjectKeyFromObject(obj), obj); err != nil {
			if apierrors.IsNotFound(err) {
				continue
			}
			return nil, fmt.Errorf("read rollback resource: %w", err)
		}
		if obj.GetUID() != saved.UID || obj.GetDeletionTimestamp() != nil || metav1.GetControllerOf(obj) != nil {
			return nil, fmt.Errorf("rollback resource %s was replaced, claimed or deleted", resourceKey(*obj))
		}
		result = append(result, *obj)
	}
	return result, nil
}
