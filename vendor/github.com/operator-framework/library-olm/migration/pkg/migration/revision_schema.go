package migration

import (
	"context"
	"encoding/json"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/uuid"
	"sigs.k8s.io/controller-runtime/pkg/client"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	ocv1ac "github.com/operator-framework/operator-controller/applyconfigurations/api/v1"
)

// validateMigrationRevision asks the API server to validate the proposed staging
// object without persisting it. Strict field validation rejects obsolete schemas
// instead of silently pruning revision entries. This does not execute controllers
// or validate the contents of the referenced Secrets as Kubernetes resources.
func (m *Migrator) validateMigrationRevision(ctx context.Context, opts Options, info *MigrationInfo) error {
	packingName := opts.ClusterExtensionName + "-1"
	if opts.UseClusterObjectDeployment {
		packingName = opts.ClusterExtensionName
	}
	phases, _, err := buildMigrationPhases(opts, info, packingName)
	if err != nil {
		return err
	}
	marker := string(uuid.NewUUID())
	var candidate client.Object
	if opts.UseClusterObjectDeployment {
		candidate, err = buildClusterObjectDeployment(opts, info, phases, marker)
	} else {
		candidate, err = buildClusterObjectSet(opts, info, phases, marker)
	}
	if err != nil {
		return err
	}
	if err := m.Client.Create(ctx, candidate, client.DryRunAll, client.FieldValidation(metav1.FieldValidationStrict)); err != nil {
		return fmt.Errorf("validate migration revision with server-side dry run: %w", err)
	}
	return nil
}

// buildMigrationPhases prepares packed references without writing Secrets.
func buildMigrationPhases(opts Options, info *MigrationInfo, packingName string) ([]*ocv1ac.ClusterObjectSetPhaseApplyConfiguration, *packResult, error) {
	cosObjects := make([]ocv1ac.ClusterObjectSetObjectApplyConfiguration, 0, len(info.CollectedObjects))
	for _, obj := range info.CollectedObjects {
		stripped := stripResource(obj)
		cosObjects = append(cosObjects, *ocv1ac.ClusterObjectSetObject().
			WithType(ocv1.ObjectTypeInlineManifest).WithInlineManifest(stripped).
			WithCollisionProtection(ocv1.CollisionProtectionNone))
	}

	phases := PhaseSort(cosObjects)

	// Pack inline objects into Secrets to stay within etcd's size limit (R2.4).
	// SecretPacker gzip-compresses large objects and splits across multiple Secrets
	// when the combined size would exceed 900 KiB per Secret.
	// TODO: consider exporting secretPacker so consumers can configure whether to use
	// Secret-backed refs or inline objects (useful for small bundles or testing).
	packer := &secretPacker{
		RevisionName:    packingName,
		OwnerName:       opts.ClusterExtensionName,
		SystemNamespace: opts.SystemNamespace,
	}
	packed, err := packer.pack(phases)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to pack COS objects into Secrets: %w", err)
	}
	// Replace inline objects with Secret refs in the phases.
	for pos, ref := range packed.Refs {
		phaseIdx, objIdx := pos[0], pos[1]
		localRef := ref
		phases[phaseIdx].Objects[objIdx].InlineManifest = nil
		phases[phaseIdx].Objects[objIdx].WithType(ocv1.ObjectTypeSecretReference)
		phases[phaseIdx].Objects[objIdx].SecretRef = &ocv1ac.SecretSourceRefApplyConfiguration{
			Name:      &localRef.Name,
			Namespace: &localRef.Namespace,
			Key:       &localRef.Key,
		}
	}

	return phases, packed, nil
}

// buildClusterObjectSet constructs the same candidate for validation and creation.
func buildClusterObjectSet(opts Options, info *MigrationInfo, phases []*ocv1ac.ClusterObjectSetPhaseApplyConfiguration, marker string) (*ocv1.ClusterObjectSet, error) {
	cosSpec := ocv1ac.ClusterObjectSetSpec().
		WithGroup(opts.ClusterExtensionName).
		WithRevision(1).
		WithCollisionProtection(ocv1.CollisionProtectionNone).
		WithLifecycleState(ocv1.ClusterObjectSetLifecycleStateActive).
		WithPhases(phases...)

	cosAnnotations := map[string]string{
		MigratedFromSubscriptionAnnotation: fmt.Sprintf("%s/%s", opts.SubscriptionNamespace, opts.SubscriptionName),
		LabelPackageName:                   info.PackageName,
		LabelBundleName:                    info.BundleName,
		LabelBundleVersion:                 info.Version,
		migrationInvocationAnnotation:      marker,
	}
	if info.BundleImage != "" {
		cosAnnotations[LabelBundleReference] = info.BundleImage
	}

	cos := ocv1ac.ClusterObjectSet(opts.ClusterExtensionName + "-1").
		WithSpec(cosSpec).
		WithLabels(map[string]string{
			LabelOwnerKind:           ocv1.ClusterExtensionKind,
			LabelOwnerName:           opts.ClusterExtensionName,
			controllerManagedByLabel: "object-controller",
		}).
		WithAnnotations(cosAnnotations)

	cosData, err := json.Marshal(cos)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal COS: %w", err)
	}
	cosObj := &ocv1.ClusterObjectSet{}
	if err := json.Unmarshal(cosData, cosObj); err != nil {
		return nil, fmt.Errorf("failed to decode COS: %w", err)
	}

	return cosObj, nil
}
