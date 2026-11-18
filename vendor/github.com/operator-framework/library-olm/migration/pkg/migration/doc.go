// Package migration provides the OLMv0-to-OLMv1 operator migration library.
// It profiles OLMv0 Subscriptions, checks eligibility, transfers operator
// resources to a ClusterObjectSet, and creates a ClusterExtension to take over
// management. CatalogSource conversion is provided separately by the
// catalogmigration package.
//
// Construct a Migrator with NewMigrator. Use Check or ScanAll to classify
// operators before calling Migrate. Gather inventories resources without
// mutation, but is not a complete eligibility or target-cluster preflight.
// Migrate performs those checks itself before removing OLMv0 management.
// Rollback restores a Subscription from migration annotations; Cleanup resolves
// a Conflict when both a Subscription and its migrated ClusterExtension exist.
// Migration can leave resources requiring inspection if the target may have
// started reconciling, so callers should report errors and avoid blind retries.
package migration
