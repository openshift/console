package migration

import (
	"context"
	"fmt"

	apivalidation "k8s.io/apimachinery/pkg/api/validation"
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
	phases, _, err := buildMigrationPhases(opts, info, opts.ClusterExtensionName)
	if err != nil {
		return err
	}
	candidate, err := buildClusterObjectDeployment(opts, info, phases, string(uuid.NewUUID()))
	if err != nil {
		return err
	}
	if err := apivalidation.ValidateAnnotationsSize(candidate.GetAnnotations()); err != nil {
		return fmt.Errorf("validate migration revision annotations: %w", err)
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
