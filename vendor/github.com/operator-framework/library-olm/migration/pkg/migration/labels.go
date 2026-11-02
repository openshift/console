package migration

import "time"

// Label and annotation keys used by the migration tool.
// These match the values expected by operator-controller but are defined here
// to avoid importing internal packages from that module.
const (
	// LabelOwnerKind is set on ClusterObjectSet to indicate its owner's kind.
	LabelOwnerKind = "olm.operatorframework.io/owner-kind"
	// LabelOwnerName is set on ClusterObjectSet to indicate its owner's name.
	LabelOwnerName = "olm.operatorframework.io/owner-name"
	// LabelRevisionName is set on ref Secrets to identify the ClusterObjectSet.
	LabelRevisionName = "olm.operatorframework.io/revision-name"
	// LabelPackageName records the operator package associated with a ClusterObjectSet.
	LabelPackageName = "olm.operatorframework.io/package-name"
	// LabelBundleName records the bundle name for a ClusterObjectSet.
	LabelBundleName = "olm.operatorframework.io/bundle-name"
	// LabelBundleVersion records the bundle version for a ClusterObjectSet.
	LabelBundleVersion = "olm.operatorframework.io/bundle-version"
	// LabelBundleReference records the bundle image reference for a ClusterObjectSet.
	LabelBundleReference = "olm.operatorframework.io/bundle-reference"
	// LabelMetadataName is the well-known label key for ClusterCatalog name selection.
	LabelMetadataName = "olm.operatorframework.io/metadata.name"

	// SecretTypeObjectData is the Secret type for externalized COS object content.
	SecretTypeObjectData = "olm.operatorframework.io/object-data" //nolint:gosec // G101 false positive: this is a Kubernetes Secret type identifier, not a credential

	// MigratedFromSubscriptionAnnotation is set on both the COS and CE.
	// Value is "<namespace>/<name>" of the source Subscription.
	MigratedFromSubscriptionAnnotation = "olm.operatorframework.io/migrated-from-subscription"

	// MigrationSubscriptionBackupAnnotation holds JSON-encoded Subscription spec on the CE (R2.5).
	MigrationSubscriptionBackupAnnotation = "olm.operatorframework.io/migration-subscription-backup"

	// MigrationOperatorGroupBackupAnnotation holds JSON-encoded OperatorGroup spec on the CE (R2.5).
	MigrationOperatorGroupBackupAnnotation = "olm.operatorframework.io/migration-operatorgroup-backup"

	// AnnotationAcknowledgedPrefix is the prefix for per-flag audit annotations on the CE (R2.5).
	// Full key: AnnotationAcknowledgedPrefix + "<flag-name>", value "true".
	AnnotationAcknowledgedPrefix = "olm.operatorframework.io/acknowledged-"

	// MigratedFromCatalogSourceAnnotation is set on ClusterCatalog by the catalog migration tool.
	MigratedFromCatalogSourceAnnotation = "olm.operatorframework.io/migrated-from-catalogsource"

	// cosWaitPollInterval / cosWaitTimeout control how long to wait for a
	// ClusterObjectSet to reach Succeeded=True.
	cosWaitPollInterval = 5 * time.Second
	cosWaitTimeout      = 5 * time.Minute

	// ceWaitPollInterval / ceWaitTimeout control how long to wait for a
	// ClusterExtension to reach Installed=True.
	ceWaitPollInterval = 5 * time.Second
	ceWaitTimeout      = 5 * time.Minute

	// subWaitPollInterval / subWaitTimeout control how long to wait for a
	// restored Subscription to reach a steady state during rollback.
	subWaitPollInterval = 5 * time.Second
	subWaitTimeout      = 5 * time.Minute
)
