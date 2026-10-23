package migration

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"time"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/util/retry"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
)

const (
	boxcutterRevisionAnnotation       = "olm.operatorframework.io/revision"
	boxcutterManagedByLabel           = "app.kubernetes.io/managed-by"
	boxcutterManagedLabel             = "boxcutter-managed"
	rollbackReleaseSnapshotAnnotation = "olm.operatorframework.io/rollback-release-snapshot"
	rollbackFinalizer                 = "olm.operatorframework.io/migration-rollback"
)

func (m *Migrator) saveRollbackSnapshot(ctx context.Context, ce *ocv1.ClusterExtension, revisions []ocv1.ClusterObjectSet) ([]rollbackObject, error) {
	observed, err := m.snapshotRevisionObjects(ctx, revisions)
	if err != nil {
		return nil, fmt.Errorf("failed to inspect ClusterObjectSet resources before rollback: %w", err)
	}
	var savedObjects []rollbackObject
	err = retry.RetryOnConflict(retry.DefaultRetry, func() error {
		var current ocv1.ClusterExtension
		if err := m.Client.Get(ctx, client.ObjectKeyFromObject(ce), &current); err != nil {
			return err
		}
		var existing []rollbackObject
		if saved := current.Annotations[rollbackReleaseSnapshotAnnotation]; saved != "" {
			if err := json.Unmarshal([]byte(saved), &existing); err != nil {
				return fmt.Errorf("invalid rollback resource snapshot on ClusterExtension %s: %w", ce.Name, err)
			}
		}
		merged, changed, err := mergeRollbackObjects(existing, observed)
		if err != nil {
			return err
		}
		savedObjects = merged
		if !changed && current.Annotations[rollbackReleaseSnapshotAnnotation] != "" {
			return nil
		}
		encoded, err := json.Marshal(savedObjects)
		if err != nil {
			return fmt.Errorf("failed to encode rollback resource snapshot: %w", err)
		}
		before := current.DeepCopy()
		if current.Annotations == nil {
			current.Annotations = map[string]string{}
		}
		current.Annotations[rollbackReleaseSnapshotAnnotation] = string(encoded)
		if err := m.Client.Patch(ctx, &current, client.MergeFromWithOptions(before, client.MergeFromWithOptimisticLock{})); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("failed to save rollback resource snapshot: %w", err)
	}
	return savedObjects, nil
}

func (m *Migrator) beginRollbackDeletion(ctx context.Context, ce *ocv1.ClusterExtension) error {
	if !controllerutil.ContainsFinalizer(ce, rollbackFinalizer) {
		before := ce.DeepCopy()
		controllerutil.AddFinalizer(ce, rollbackFinalizer)
		if err := m.Client.Patch(ctx, ce, client.MergeFromWithOptions(before, client.MergeFromWithOptimisticLock{})); err != nil {
			return fmt.Errorf("failed to protect ClusterExtension backup during rollback: %w", err)
		}
	}
	if ce.DeletionTimestamp == nil {
		if err := m.Client.Delete(ctx, ce, client.PropagationPolicy("Orphan")); client.IgnoreNotFound(err) != nil {
			return fmt.Errorf("failed to start ClusterExtension deletion: %w", err)
		}
	}
	return nil
}

func (m *Migrator) finishRollbackDeletion(ctx context.Context, name string) error {
	var ce ocv1.ClusterExtension
	if err := m.Client.Get(ctx, client.ObjectKey{Name: name}, &ce); err != nil {
		return fmt.Errorf("failed to get deleting ClusterExtension %s: %w", name, err)
	}
	before := ce.DeepCopy()
	controllerutil.RemoveFinalizer(&ce, rollbackFinalizer)
	if err := m.Client.Patch(ctx, &ce, client.MergeFromWithOptions(before, client.MergeFromWithOptimisticLock{})); err != nil {
		return fmt.Errorf("failed to finish ClusterExtension %s deletion: %w", name, err)
	}
	return nil
}

type rollbackObject struct {
	Identity         unstructured.Unstructured `json:"identity"`
	UID              types.UID                 `json:"uid"`
	OwnerUID         types.UID                 `json:"ownerUID"`
	Revision         string                    `json:"revision"`
	ManagedBy        string                    `json:"managedBy"`
	Managed          string                    `json:"managed"`
	AdditionalOwners []rollbackOwnership       `json:"additionalOwners,omitempty"`
}

type rollbackOwnership struct {
	OwnerUID  types.UID `json:"ownerUID"`
	Revision  string    `json:"revision"`
	ManagedBy string    `json:"managedBy"`
	Managed   string    `json:"managed"`
}

func (object rollbackObject) ownerships() []rollbackOwnership {
	owners := []rollbackOwnership{{OwnerUID: object.OwnerUID, Revision: object.Revision, ManagedBy: object.ManagedBy, Managed: object.Managed}}
	return append(owners, object.AdditionalOwners...)
}

// mergeRollbackObjects retains the original resource UID and accepts another
// owner only when a listed revision was observed controlling that same object.
func mergeRollbackObjects(saved, observed []rollbackObject) ([]rollbackObject, bool, error) {
	merged := append([]rollbackObject(nil), saved...)
	index := make(map[string]int, len(merged))
	for i := range merged {
		index[resourceKey(merged[i].Identity)] = i
	}
	changed := false
	for _, candidate := range observed {
		key := resourceKey(candidate.Identity)
		i, exists := index[key]
		if !exists {
			index[key] = len(merged)
			merged = append(merged, candidate)
			changed = true
			continue
		}
		if merged[i].UID != candidate.UID {
			return nil, false, fmt.Errorf("resource %s was replaced during rollback", key)
		}
		ownership := candidate.ownerships()[0]
		found := false
		for _, prior := range merged[i].ownerships() {
			if prior.OwnerUID != ownership.OwnerUID {
				continue
			}
			if prior != ownership {
				return nil, false, fmt.Errorf("ownership metadata on %s changed during rollback", key)
			}
			found = true
			break
		}
		if !found {
			merged[i].AdditionalOwners = append(merged[i].AdditionalOwners, ownership)
			changed = true
		}
	}
	return merged, changed, nil
}

// snapshotRevisionObjects records only resources currently controlled by a
// revision being removed. It runs before deletion, while ownership is provable.
func (m *Migrator) snapshotRevisionObjects(ctx context.Context, revisions []ocv1.ClusterObjectSet) ([]rollbackObject, error) {
	var objects []rollbackObject
	seen := map[string]bool{}
	for i := range revisions {
		revision := &revisions[i]
		for _, phase := range revision.Spec.Phases {
			for _, entry := range phase.Objects {
				manifest := entry.Object
				if entry.Ref.Name != "" {
					var err error
					manifest, err = m.rollbackReferencedObject(ctx, entry.Ref)
					if err != nil {
						return nil, fmt.Errorf("ClusterObjectSet %s phase %s: %w", revision.Name, phase.Name, err)
					}
				}
				if manifest.GetAPIVersion() == "" || manifest.GetKind() == "" || manifest.GetName() == "" {
					return nil, fmt.Errorf("ClusterObjectSet %s phase %s has an incomplete object identity", revision.Name, phase.Name)
				}
				key := resourceKey(manifest)
				if seen[key] {
					continue
				}
				live := &unstructured.Unstructured{}
				live.SetGroupVersionKind(manifest.GroupVersionKind())
				if err := m.Client.Get(ctx, client.ObjectKeyFromObject(&manifest), live); err != nil {
					if apierrors.IsNotFound(err) {
						continue
					}
					return nil, fmt.Errorf("getting %s for rollback: %w", key, err)
				}
				owner := metav1.GetControllerOf(live)
				if owner == nil || owner.UID != revision.UID || owner.Kind != "ClusterObjectSet" {
					continue
				}
				if live.GetAnnotations()[boxcutterRevisionAnnotation] == "" {
					continue
				}
				seen[key] = true
				identity := unstructured.Unstructured{}
				identity.SetGroupVersionKind(live.GroupVersionKind())
				identity.SetName(live.GetName())
				identity.SetNamespace(live.GetNamespace())
				objects = append(objects, rollbackObject{
					Identity: identity, UID: live.GetUID(), OwnerUID: owner.UID,
					Revision:  live.GetAnnotations()[boxcutterRevisionAnnotation],
					ManagedBy: live.GetLabels()[boxcutterManagedByLabel],
					Managed:   live.GetLabels()[boxcutterManagedLabel],
				})
			}
		}
	}
	return objects, nil
}

func (m *Migrator) rollbackReferencedObject(ctx context.Context, ref ocv1.ObjectSourceRef) (unstructured.Unstructured, error) {
	var secret corev1.Secret
	if err := m.Client.Get(ctx, client.ObjectKey{Name: ref.Name, Namespace: ref.Namespace}, &secret); err != nil {
		return unstructured.Unstructured{}, fmt.Errorf("getting object Secret %s/%s: %w", ref.Namespace, ref.Name, err)
	}
	data, ok := secret.Data[ref.Key]
	if !ok {
		return unstructured.Unstructured{}, fmt.Errorf("object Secret %s/%s has no key %q", ref.Namespace, ref.Name, ref.Key)
	}
	if len(data) >= 2 && data[0] == 0x1f && data[1] == 0x8b {
		reader, err := gzip.NewReader(bytes.NewReader(data))
		if err != nil {
			return unstructured.Unstructured{}, fmt.Errorf("opening compressed object: %w", err)
		}
		data, err = io.ReadAll(io.LimitReader(reader, 10*1024*1024+1))
		closeErr := reader.Close()
		if err != nil {
			return unstructured.Unstructured{}, fmt.Errorf("reading compressed object: %w", err)
		}
		if closeErr != nil {
			return unstructured.Unstructured{}, fmt.Errorf("closing compressed object: %w", closeErr)
		}
		if len(data) > 10*1024*1024 {
			return unstructured.Unstructured{}, fmt.Errorf("compressed object exceeds 10 MiB")
		}
	}
	var object unstructured.Unstructured
	if err := json.Unmarshal(data, &object.Object); err != nil {
		return unstructured.Unstructured{}, fmt.Errorf("decoding object Secret %s/%s key %q: %w", ref.Namespace, ref.Name, ref.Key, err)
	}
	return object, nil
}

// waitForRollbackRevisionsRemoved saves ownership from revisions created by a
// CE reconciliation already in flight, then deletes those revisions by UID.
func (m *Migrator) waitForRollbackRevisionsRemoved(ctx context.Context, ce *ocv1.ClusterExtension, objects *[]rollbackObject) error {
	emptyObservations := 0
	var pending string
	err := wait.PollUntilContextTimeout(ctx, time.Second, 2*time.Minute, true, func(ctx context.Context) (bool, error) {
		var revisions ocv1.ClusterObjectSetList
		if err := m.Client.List(ctx, &revisions, client.MatchingLabels{LabelOwnerName: ce.Name}); err != nil {
			return false, err
		}
		migrationName := ce.Name + "-1"
		foundMigrationRevision := false
		for i := range revisions.Items {
			if revisions.Items[i].Name == migrationName {
				foundMigrationRevision = true
				break
			}
		}
		if !foundMigrationRevision {
			var migrationRevision ocv1.ClusterObjectSet
			err := m.Client.Get(ctx, client.ObjectKey{Name: migrationName}, &migrationRevision)
			if client.IgnoreNotFound(err) != nil {
				return false, err
			}
			if err == nil {
				if owner := migrationRevision.Labels[LabelOwnerName]; owner != "" && owner != ce.Name {
					return false, fmt.Errorf("migration ClusterObjectSet %s belongs to another extension %q", migrationName, owner)
				}
				revisions.Items = append(revisions.Items, migrationRevision)
			}
		}
		if len(revisions.Items) == 0 {
			emptyObservations++
			return emptyObservations >= 3, nil
		}
		emptyObservations = 0
		refreshed, err := m.saveRollbackSnapshot(ctx, ce, revisions.Items)
		if err != nil {
			return false, err
		}
		*objects = refreshed
		for i := range revisions.Items {
			pending = revisions.Items[i].Name
			if revisions.Items[i].DeletionTimestamp != nil {
				continue
			}
			if err := m.deleteTrackedResource(ctx, &revisions.Items[i], client.PropagationPolicy("Orphan")); err != nil &&
				!apierrors.IsNotFound(err) && !apierrors.IsConflict(err) {
				return false, fmt.Errorf("deleting ClusterObjectSet %s: %w", pending, err)
			}
		}
		return false, nil
	})
	if err != nil {
		return fmt.Errorf("waiting for ClusterObjectSet %s deletion: %w", pending, err)
	}
	return nil
}

// releaseRevisionObjects waits for orphan propagation, then removes metadata
// written by the old object controller. The UID and recorded metadata guard
// against modifying an object replaced or adopted during rollback.
func (m *Migrator) releaseRevisionObjects(ctx context.Context, objects []rollbackObject) error {
	for _, original := range objects {
		key := client.ObjectKeyFromObject(&original.Identity)
		if err := wait.PollUntilContextTimeout(ctx, time.Second, 2*time.Minute, true, func(ctx context.Context) (bool, error) {
			current := &unstructured.Unstructured{}
			current.SetGroupVersionKind(original.Identity.GroupVersionKind())
			if err := m.Client.Get(ctx, key, current); err != nil {
				return apierrors.IsNotFound(err), client.IgnoreNotFound(err)
			}
			if current.GetUID() != original.UID {
				return false, fmt.Errorf("resource %s was replaced during rollback", key)
			}
			if owner := metav1.GetControllerOf(current); owner != nil {
				knownOwner := false
				for _, prior := range original.ownerships() {
					if prior.OwnerUID == owner.UID {
						knownOwner = true
						break
					}
				}
				if !knownOwner {
					return false, fmt.Errorf("resource %s acquired another controller during rollback", key)
				}
				return false, nil
			}
			currentRevision := current.GetAnnotations()[boxcutterRevisionAnnotation]
			currentManagedBy := current.GetLabels()[boxcutterManagedByLabel]
			currentManaged := current.GetLabels()[boxcutterManagedLabel]
			knownMetadata := false
			for _, prior := range original.ownerships() {
				if (currentRevision == "" || currentRevision == prior.Revision) &&
					(currentManagedBy == "" || currentManagedBy == prior.ManagedBy) &&
					(currentManaged == "" || currentManaged == prior.Managed) {
					knownMetadata = true
					break
				}
			}
			if !knownMetadata {
				return false, fmt.Errorf("ownership metadata on %s changed during rollback", key)
			}
			if currentRevision == "" && currentManagedBy == "" && currentManaged == "" {
				return true, nil
			}
			updated := current.DeepCopy()
			annotations := updated.GetAnnotations()
			delete(annotations, boxcutterRevisionAnnotation)
			updated.SetAnnotations(annotations)
			labels := updated.GetLabels()
			if currentManagedBy == "olm.operatorframework.io" {
				delete(labels, boxcutterManagedByLabel)
			}
			delete(labels, boxcutterManagedLabel)
			updated.SetLabels(labels)
			if err := m.Client.Patch(ctx, updated, client.MergeFromWithOptions(current, client.MergeFromWithOptimisticLock{})); err != nil {
				if apierrors.IsConflict(err) {
					return false, nil
				}
				return false, fmt.Errorf("releasing %s: %w", key, err)
			}
			return true, nil
		}); err != nil {
			return fmt.Errorf("waiting to release %s: %w", key, err)
		}
	}
	return nil
}
