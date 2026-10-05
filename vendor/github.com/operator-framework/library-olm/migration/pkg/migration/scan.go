package migration

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/validation"
	"sigs.k8s.io/controller-runtime/pkg/client"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
	ocv1 "github.com/operator-framework/operator-controller/api/v1"
)

// OperatorScanResult holds the result of scanning a single Subscription for migration eligibility.
type OperatorScanResult struct {
	SubscriptionName      string
	SubscriptionNamespace string
	PackageName           string
	InstalledCSV          string
	Version               string
	State                 string
	Status                OperatorStatus // four-state classification
	Reason                string         // human-readable explanation of the status (R1.3)
	Eligible              bool           // true when Status == Eligible (backwards compat)
	// Warnings are informational notices that do not affect eligibility (R9).
	// Example: other installed operators declare a dependency on this package.
	Warnings     []string
	Error        error
	Checks       []CheckResult // all evaluated checks, including passing checks
	FailedChecks []CheckResult
}

// ScanAllSubscriptions discovers all Subscriptions on the cluster, checks each for migration
// eligibility, and also detects AlreadyMigrated and Conflict states from ClusterExtensions.
func (m *Migrator) ScanAllSubscriptions(ctx context.Context) ([]OperatorScanResult, error) {
	return m.ScanAllSubscriptionsWithOptions(ctx, Options{})
}

// ScanAllSubscriptionsWithOptions classifies all Subscriptions using the supplied
// acknowledgment overrides. Per-operator names and namespaces come from each
// Subscription; other options are shared across the batch.
func (m *Migrator) ScanAllSubscriptionsWithOptions(ctx context.Context, defaults Options) ([]OperatorScanResult, error) {
	// List all Subscriptions
	var subList operatorsv1alpha1.SubscriptionList
	if err := m.Client.List(ctx, &subList); err != nil {
		return nil, fmt.Errorf("failed to list Subscriptions: %w", err)
	}

	// List all ClusterExtensions with migrated-from-subscription annotation
	var ceList ocv1.ClusterExtensionList
	if err := m.Client.List(ctx, &ceList); err != nil {
		return nil, fmt.Errorf("failed to list ClusterExtensions: %w", err)
	}

	// Build a map of migration-annotated CEs: "<ns>/<sub-name>" -> CE name
	migratedCEBySubRef := make(map[string]string)
	for _, ce := range ceList.Items {
		if ref, ok := ce.Annotations[MigratedFromSubscriptionAnnotation]; ok {
			migratedCEBySubRef[ref] = ce.Name
		}
	}

	// Build a set of Subscription refs that currently exist
	existingSubs := make(map[string]bool)
	for _, sub := range subList.Items {
		existingSubs[fmt.Sprintf("%s/%s", sub.Namespace, sub.Name)] = true
	}

	var results []OperatorScanResult

	// Check each existing Subscription
	for _, sub := range subList.Items {
		subRef := fmt.Sprintf("%s/%s", sub.Namespace, sub.Name)

		result := OperatorScanResult{
			SubscriptionName:      sub.Name,
			SubscriptionNamespace: sub.Namespace,
			PackageName:           sub.Spec.Package,
			InstalledCSV:          sub.Status.InstalledCSV,
			State:                 string(sub.Status.State),
		}

		// Conflict: both Subscription and annotated CE exist
		if _, hasCE := migratedCEBySubRef[subRef]; hasCE {
			result.Status = OperatorStatusConflict
			result.Reason = "both Subscription and annotated ClusterExtension exist; resolve with cleanup or rollback"
			result.Eligible = false
			result.Error = fmt.Errorf("%s", result.Reason)
			results = append(results, result)
			continue
		}

		opts := defaults
		opts.SubscriptionName = sub.Name
		opts.SubscriptionNamespace = sub.Namespace
		opts.ApplyDefaults()

		m.progress(ProgressEvent{Step: ProgressStepScan, Status: ProgressWaiting, Message: fmt.Sprintf("Checking %s/%s (%s)...", sub.Namespace, sub.Name, sub.Spec.Package)})

		// Readiness checks
		readiness, err := m.CheckReadiness(ctx, opts)
		if err != nil {
			result.Status = OperatorStatusIneligible
			result.Reason = err.Error()
			result.Error = err
			results = append(results, result)
			continue
		}
		result.Checks = append(result.Checks, readiness.Checks...)

		// Get CSV for compatibility checks
		_, csv, ip, err := m.GetCSVAndInstallPlan(ctx, opts)
		if err != nil {
			result.Status = OperatorStatusIneligible
			result.Reason = fmt.Sprintf("failed to get CSV: %v", err)
			result.Error = fmt.Errorf("failed to get CSV: %w", err)
			results = append(results, result)
			continue
		}

		result.Version = parseCSVVersion(csv)

		// Compatibility checks
		propsJSON := csv.Annotations["operatorframework.io/properties"]
		compat, err := m.CheckCompatibility(ctx, opts, csv, propsJSON)
		if err != nil {
			result.Status = OperatorStatusIneligible
			result.Reason = fmt.Sprintf("compatibility check error: %v", err)
			result.Error = fmt.Errorf("compatibility check error: %w", err)
			results = append(results, result)
			continue
		}
		result.Checks = append(result.Checks, compat.Checks...)

		// Merge readiness + compat failed checks
		result.FailedChecks = append(readiness.FailedChecks(), compat.FailedChecks()...)
		bundleInfo, err := m.validatedBundleInfo(ctx, opts, csv, ip)
		if err != nil {
			catalogCheck := CheckResult{
				Name: "CatalogSource type", Passed: false, Message: err.Error(),
			}
			result.Checks = append(result.Checks, catalogCheck)
			result.FailedChecks = append(result.FailedChecks, catalogCheck)
		}

		// C7: catalog availability (hard check — no override).
		// Only run when readiness+compat pass to avoid noisy catalog errors for clearly ineligible operators.
		if len(result.FailedChecks) == 0 { //nolint:nestif
			catalogName, catalogErr := m.ResolveClusterCatalog(ctx, bundleInfo, m.RESTConfig)
			if catalogErr != nil {
				catalogCheck := CheckResult{
					Name:    "Catalog availability",
					Passed:  false,
					Message: fmt.Sprintf("No ClusterCatalog found for package %q; run migrate-catalogs-v0-to-v1 first: %v", sub.Spec.Package, catalogErr),
				}
				result.Checks = append(result.Checks, catalogCheck)
				result.FailedChecks = append(result.FailedChecks, catalogCheck)
				result.Status = OperatorStatusIneligible
				result.Reason = fmt.Sprintf("package %q not found in any serving ClusterCatalog", sub.Spec.Package)
				result.Eligible = false
			} else {
				result.Checks = append(result.Checks, CheckResult{
					Name:    "Catalog availability",
					Passed:  true,
					Message: fmt.Sprintf("package available in ClusterCatalog %s", catalogName),
				})
				result.Status = OperatorStatusEligible
				result.Reason = "passes all readiness, compatibility, and catalog-availability checks"
				result.Eligible = true
				// R9: warn if other installed operators declare a dependency on this package.
				if dependents := m.findDependents(ctx, sub.Spec.Package); len(dependents) > 0 {
					result.Warnings = append(result.Warnings,
						fmt.Sprintf("other operator(s) may depend on package %q: %v — verify they remain functional after migration", sub.Spec.Package, dependents))
				}
			}
		} else {
			result.Status = OperatorStatusIneligible
			result.Reason = fmt.Sprintf("%d check(s) failed", len(result.FailedChecks))
			result.Eligible = false
		}
		results = append(results, result)
	}

	// Check for AlreadyMigrated: CE with annotation but no matching Subscription
	for subRef, ceName := range migratedCEBySubRef {
		if existingSubs[subRef] {
			continue // handled above as Conflict or normal sub
		}
		results = append(results, OperatorScanResult{
			SubscriptionName: ceName,
			Status:           OperatorStatusAlreadyMigrated,
			Reason:           fmt.Sprintf("ClusterExtension %s exists with migrated-from-subscription annotation; Subscription is gone", ceName),
			Eligible:         false,
			State:            fmt.Sprintf("ClusterExtension %s (migrated from %s)", ceName, subRef),
		})
	}

	return results, nil
}

// ScanSubscription checks a single Subscription and returns its scan result.
func (m *Migrator) ScanSubscription(ctx context.Context, opts Options) (*OperatorScanResult, error) {
	opts.ApplyDefaults()

	result := &OperatorScanResult{
		SubscriptionName:      opts.SubscriptionName,
		SubscriptionNamespace: opts.SubscriptionNamespace,
	}

	// Check for Conflict first
	var ceList ocv1.ClusterExtensionList
	if err := m.Client.List(ctx, &ceList); err != nil {
		return nil, fmt.Errorf("failed to list ClusterExtensions: %w", err)
	}
	subRef := fmt.Sprintf("%s/%s", opts.SubscriptionNamespace, opts.SubscriptionName)
	for _, ce := range ceList.Items {
		if ref, ok := ce.Annotations[MigratedFromSubscriptionAnnotation]; ok && ref == subRef {
			result.Status = OperatorStatusConflict
			result.Reason = fmt.Sprintf("both Subscription and annotated ClusterExtension %s exist; resolve with cleanup or rollback", ce.Name)
			result.Error = fmt.Errorf("%s", result.Reason)
			return result, nil
		}
	}

	readiness, err := m.CheckReadiness(ctx, opts)
	if err != nil {
		return nil, err
	}
	result.Checks = append(result.Checks, readiness.Checks...)

	sub, csv, ip, err := m.GetCSVAndInstallPlan(ctx, opts)
	if err != nil {
		result.Status = OperatorStatusIneligible
		result.Reason = err.Error()
		result.Error = err
		return result, nil
	}

	result.PackageName = sub.Spec.Package
	result.InstalledCSV = csv.Name
	result.Version = parseCSVVersion(csv)

	propsJSON := csv.Annotations["operatorframework.io/properties"]
	compat, err := m.CheckCompatibility(ctx, opts, csv, propsJSON)
	if err != nil {
		result.Status = OperatorStatusIneligible
		result.Reason = err.Error()
		result.Error = err
		return result, nil
	}
	result.Checks = append(result.Checks, compat.Checks...)

	result.FailedChecks = append(readiness.FailedChecks(), compat.FailedChecks()...)
	bundleInfo, err := m.validatedBundleInfo(ctx, opts, csv, ip)
	if err != nil {
		catalogCheck := CheckResult{
			Name: "CatalogSource type", Passed: false, Message: err.Error(),
		}
		result.Checks = append(result.Checks, catalogCheck)
		result.FailedChecks = append(result.FailedChecks, catalogCheck)
	}
	if len(result.FailedChecks) > 0 {
		result.Status = OperatorStatusIneligible
		result.Reason = fmt.Sprintf("%d check(s) failed", len(result.FailedChecks))
		return result, nil
	}

	// C7: catalog availability (hard check — no override)
	catalogName, catalogErr := m.ResolveClusterCatalog(ctx, bundleInfo, m.RESTConfig)
	if catalogErr != nil {
		catalogCheck := CheckResult{
			Name:    "Catalog availability",
			Passed:  false,
			Message: fmt.Sprintf("No ClusterCatalog found for package %q; run migrate-catalogs-v0-to-v1 first: %v", result.PackageName, catalogErr),
		}
		result.Checks = append(result.Checks, catalogCheck)
		result.FailedChecks = append(result.FailedChecks, catalogCheck)
		result.Status = OperatorStatusIneligible
		result.Reason = fmt.Sprintf("package %q not found in any serving ClusterCatalog", result.PackageName)
		return result, nil
	}

	result.Checks = append(result.Checks, CheckResult{
		Name:    "Catalog availability",
		Passed:  true,
		Message: fmt.Sprintf("package available in ClusterCatalog %s", catalogName),
	})
	result.Status = OperatorStatusEligible
	result.Reason = "passes all readiness, compatibility, and catalog-availability checks"
	result.Eligible = true
	// R9: warn if other installed operators declare a dependency on this package.
	if dependents := m.findDependents(ctx, result.PackageName); len(dependents) > 0 {
		result.Warnings = append(result.Warnings,
			fmt.Sprintf("other operator(s) may depend on package %q: %v — verify they remain functional after migration", result.PackageName, dependents))
	}
	return result, nil
}

// PrintScanSummary prints results in the required order: Conflict → Ineligible → AlreadyMigrated → Eligible.
func PrintScanSummary(results []OperatorScanResult, printf func(string, ...interface{})) {
	byStatus := make(map[OperatorStatus][]OperatorScanResult)
	for _, r := range results {
		byStatus[r.Status] = append(byStatus[r.Status], r)
	}

	order := []OperatorStatus{
		OperatorStatusConflict,
		OperatorStatusIneligible,
		OperatorStatusAlreadyMigrated,
		OperatorStatusEligible,
	}

	for _, status := range order {
		list := byStatus[status]
		if len(list) == 0 {
			continue
		}
		printf("\n=== %s (%d) ===\n", status, len(list))
		for _, r := range list {
			switch status {
			case OperatorStatusConflict:
				printf("  ⚠️  %s/%s — CONFLICT: %v\n", r.SubscriptionNamespace, r.SubscriptionName, r.Error)
			case OperatorStatusIneligible:
				printf("  ✗ %s/%s", r.SubscriptionNamespace, r.SubscriptionName)
				for _, fc := range r.FailedChecks {
					printf("\n      [%s] %s", fc.Name, fc.Message)
				}
				if r.Error != nil {
					printf("\n      error: %v", r.Error)
				}
				printf("\n")
			case OperatorStatusAlreadyMigrated:
				printf("  ✓ %s (already migrated)\n", r.State)
			case OperatorStatusEligible:
				printf("  ✓ %s/%s (%s)\n", r.SubscriptionNamespace, r.SubscriptionName, r.PackageName)
			}
		}
	}
}

// EligibleFromScan returns only the Eligible results from a scan.
func EligibleFromScan(results []OperatorScanResult) []OperatorScanResult {
	var eligible []OperatorScanResult
	for _, r := range results {
		if r.Status == OperatorStatusEligible {
			eligible = append(eligible, r)
		}
	}
	return eligible
}

// RollbackClusterExtension deletes the CE and COS (orphan cascade), then restores the Subscription.
func (m *Migrator) RollbackClusterExtension(ctx context.Context, ceName string, acknowledgeInstalled bool) error {
	var ce ocv1.ClusterExtension
	if err := m.Client.Get(ctx, client.ObjectKey{Name: ceName}, &ce); err != nil {
		return fmt.Errorf("failed to get ClusterExtension %s: %w", ceName, err)
	}

	// Check if Installed=True and require acknowledgment
	if !acknowledgeInstalled {
		for _, cond := range ce.Status.Conditions {
			if cond.Type == "Installed" && cond.Status == "True" {
				return fmt.Errorf("ClusterExtension %s is Installed=True; pass --acknowledge-installed to confirm rollback", ceName)
			}
		}
	}

	// Validate the data needed to restore OLMv0 ownership before deleting any
	// OLMv1 resources. A corrupt or incomplete backup must leave the existing
	// ClusterExtension and ClusterObjectSet recoverable.
	subBackupJSON, ok := ce.Annotations[MigrationSubscriptionBackupAnnotation]
	if !ok || subBackupJSON == "" {
		return fmt.Errorf("ClusterExtension %s has no migration-subscription-backup annotation; cannot restore Subscription", ceName)
	}
	subRef := ce.Annotations[MigratedFromSubscriptionAnnotation]
	if subRef == "" {
		return fmt.Errorf("ClusterExtension %s has no migrated-from-subscription annotation", ceName)
	}
	var subSpec operatorsv1alpha1.SubscriptionSpec
	if err := unmarshalJSON(subBackupJSON, &subSpec); err != nil {
		return fmt.Errorf("failed to unmarshal subscription backup: %w", err)
	}
	if subSpec.Package == "" || subSpec.CatalogSource == "" || subSpec.CatalogSourceNamespace == "" {
		return fmt.Errorf("subscription backup is missing required package, source, or sourceNamespace")
	}
	ns, name, err := splitSubRef(subRef)
	if err != nil {
		return fmt.Errorf("invalid migrated-from-subscription annotation %q: %w", subRef, err)
	}
	var sourceNamespace corev1.Namespace
	if err := m.Client.Get(ctx, client.ObjectKey{Name: ns}, &sourceNamespace); err != nil {
		return fmt.Errorf("source namespace %q must exist before rollback can restore Subscription: %w", ns, err)
	}

	// Snapshot every revision before deleting the extension. The controller
	// creates catalog revisions after the initial migration revision, and orphan
	// propagation leaves those revisions alive unless rollback removes them too.
	var revisions ocv1.ClusterObjectSetList
	if err := m.Client.List(ctx, &revisions, client.MatchingLabels{LabelOwnerName: ceName}); err != nil {
		return fmt.Errorf("failed to list ClusterObjectSets for rollback: %w", err)
	}
	// Preserve support for old migration revisions without the owner label.
	cosName := fmt.Sprintf("%s-1", ceName)
	foundMigrationRevision := false
	for i := range revisions.Items {
		if revisions.Items[i].Name == cosName {
			foundMigrationRevision = true
			break
		}
	}
	var cos ocv1.ClusterObjectSet
	getErr := m.Client.Get(ctx, client.ObjectKey{Name: cosName}, &cos)
	if client.IgnoreNotFound(getErr) != nil {
		return fmt.Errorf("failed to get migration ClusterObjectSet: %w", getErr)
	}
	if getErr == nil && !foundMigrationRevision {
		if owner := cos.Labels[LabelOwnerName]; owner != "" && owner != ceName {
			return fmt.Errorf("migration ClusterObjectSet %s belongs to another extension %q", cosName, owner)
		}
		revisions.Items = append(revisions.Items, cos)
	}

	// Delete revisions before the CE so a failed revision deletion leaves the
	// authoritative Subscription backup available for a later rollback attempt.
	for i := range revisions.Items {
		if err := m.Client.Delete(ctx, &revisions.Items[i], client.PropagationPolicy("Orphan")); err != nil {
			if client.IgnoreNotFound(err) != nil {
				return fmt.Errorf("failed to delete ClusterObjectSet %s: %w", revisions.Items[i].Name, err)
			}
		}
	}

	// Delete CE (orphan cascade — preserves operator workloads).
	if err := m.Client.Delete(ctx, &ce, client.PropagationPolicy("Orphan")); err != nil {
		if client.IgnoreNotFound(err) != nil {
			return fmt.Errorf("failed to delete ClusterExtension: %w", err)
		}
	}

	// Restore Subscription from the validated backup.
	restoredSub := &operatorsv1alpha1.Subscription{}
	restoredSub.Name = name
	restoredSub.Namespace = ns
	restoredSub.Spec = &subSpec

	if err := m.Client.Create(ctx, restoredSub); err != nil {
		return fmt.Errorf("failed to restore Subscription %s/%s: %w", ns, name, err)
	}

	m.progress(ProgressEvent{Step: ProgressStepRollback, Status: ProgressCompleted, Message: fmt.Sprintf("Subscription %s/%s restored; operator returning to OLMv0 management", ns, name)})
	return nil
}

// CleanupConflict resolves a Conflict state: deletes the Subscription and OLMv0 artifacts,
// leaving the ClusterExtension intact.
func (m *Migrator) CleanupConflict(ctx context.Context, ceName string) error {
	var ce ocv1.ClusterExtension
	if err := m.Client.Get(ctx, client.ObjectKey{Name: ceName}, &ce); err != nil {
		return fmt.Errorf("failed to get ClusterExtension %s: %w", ceName, err)
	}

	subRef := ce.Annotations[MigratedFromSubscriptionAnnotation]
	if subRef == "" {
		return fmt.Errorf("ClusterExtension %s has no migrated-from-subscription annotation", ceName)
	}

	ns, name, err := splitSubRef(subRef)
	if err != nil {
		return fmt.Errorf("invalid migrated-from-subscription annotation %q: %w", subRef, err)
	}
	if ce.Spec.Source.Catalog == nil || ce.Spec.Source.Catalog.PackageName == "" {
		return fmt.Errorf("ClusterExtension %s has no catalog package for conflict cleanup", ceName)
	}
	packageName := ce.Spec.Source.Catalog.PackageName
	csvNames, err := m.conflictCSVNames(ctx, ns, name, packageName)
	if err != nil {
		return err
	}

	// Delete Subscription (orphan)
	sub := &operatorsv1alpha1.Subscription{}
	sub.Name = name
	sub.Namespace = ns
	if err := m.Client.Delete(ctx, sub, client.PropagationPolicy("Orphan")); err != nil {
		if client.IgnoreNotFound(err) != nil {
			return fmt.Errorf("failed to delete Subscription %s/%s: %w", ns, name, err)
		}
	}
	m.progress(ProgressEvent{Step: ProgressStepCleanup, Status: ProgressCompleted, Message: fmt.Sprintf("Deleted Subscription %s/%s", ns, name)})

	// Cleanup remaining OLMv0 resources
	opts := Options{
		SubscriptionName:      name,
		SubscriptionNamespace: ns,
		ClusterExtensionName:  ceName,
		InstallNamespace:      ns,
	}

	// A conflicting Subscription may have reinstalled its primary CSV. Leaving
	// that CSV behind makes a subsequent rollback Subscription unsatisfiable:
	// OLMv0 treats the installed but unreferenced CSV as an independent provider.
	for _, csvName := range csvNames {
		csv := &operatorsv1alpha1.ClusterServiceVersion{}
		csv.Name, csv.Namespace = csvName, ns
		if err := m.Client.Delete(ctx, csv, client.PropagationPolicy("Orphan")); client.IgnoreNotFound(err) != nil {
			return fmt.Errorf("failed to delete conflict CSV %s/%s: %w", ns, csvName, err)
		}
		if err := m.CleanupOLMv0Resources(ctx, opts, packageName, csvName).Err(); err != nil {
			return fmt.Errorf("clean up conflict artifacts: %w", err)
		}
	}
	if len(csvNames) == 0 {
		return m.CleanupOLMv0Resources(ctx, opts, packageName, "").Err()
	}
	return nil
}

// conflictCSVNames discovers primary CSVs before removing their Subscription.
// Package metadata also finds CSVs when a recreated Subscription has no status.
// Never remove a CSV that another Subscription in this namespace still uses.
func (m *Migrator) conflictCSVNames(ctx context.Context, namespace, subscription, packageName string) ([]string, error) {
	var subscriptions operatorsv1alpha1.SubscriptionList
	if err := m.Client.List(ctx, &subscriptions, client.InNamespace(namespace)); err != nil {
		return nil, fmt.Errorf("list Subscriptions before conflict cleanup: %w", err)
	}
	names := make(map[string]bool)
	for _, sub := range subscriptions.Items {
		if sub.Name != subscription {
			continue
		}
		if sub.Spec != nil && sub.Spec.Package != packageName {
			return nil, fmt.Errorf("conflict Subscription package does not match ClusterExtension package %q", packageName)
		}
		for _, name := range []string{sub.Status.InstalledCSV, sub.Status.CurrentCSV} {
			if name != "" {
				names[name] = true
			}
		}
	}
	var csvs operatorsv1alpha1.ClusterServiceVersionList
	if err := m.Client.List(ctx, &csvs, client.InNamespace(namespace)); err != nil {
		return nil, fmt.Errorf("list CSVs before conflict cleanup: %w", err)
	}
	for _, csv := range csvs.Items {
		properties, err := parseProperties(csv.Annotations["operatorframework.io/properties"])
		if err != nil {
			continue
		}
		for _, property := range properties {
			if property.Type != "olm.package" {
				continue
			}
			var value struct {
				PackageName string `json:"packageName"`
			}
			if err := json.Unmarshal(property.Value, &value); err != nil {
				continue
			}
			if names[csv.Name] && value.PackageName != "" && value.PackageName != packageName {
				return nil, fmt.Errorf("conflict CSV %s/%s belongs to package %q, not %q", namespace, csv.Name, value.PackageName, packageName)
			}
			if value.PackageName == packageName {
				names[csv.Name] = true
			}
		}
	}
	for _, sub := range subscriptions.Items {
		if sub.Name == subscription {
			continue
		}
		if names[sub.Status.InstalledCSV] || names[sub.Status.CurrentCSV] || sub.Spec != nil && sub.Spec.Package == packageName {
			return nil, fmt.Errorf("cannot clean up package %q: Subscription %s/%s still references its CSVs", packageName, namespace, sub.Name)
		}
	}
	result := make([]string, 0, len(names))
	for name := range names {
		result = append(result, name)
	}
	sort.Strings(result)
	return result, nil
}

// splitSubRef splits a "namespace/name" subscription reference into its components.
func splitSubRef(ref string) (string, string, error) {
	if strings.Count(ref, "/") != 1 {
		return "", "", fmt.Errorf("invalid namespace/name ref %q", ref)
	}
	parts := strings.SplitN(ref, "/", 2)
	if len(validation.IsDNS1123Label(parts[0])) != 0 || len(validation.IsDNS1123Subdomain(parts[1])) != 0 {
		return "", "", fmt.Errorf("invalid namespace/name ref %q", ref)
	}
	return parts[0], parts[1], nil
}

func unmarshalJSON(data string, v interface{}) error {
	return json.Unmarshal([]byte(data), v)
}

// ── Canonical R1.1 library API ────────────────────────────────────────────────

// ScanAll classifies all OLMv0 Subscriptions into the four states (R1.1),
// including catalog-availability (C7) per operator.
func (m *Migrator) ScanAll(ctx context.Context) ([]OperatorScanResult, error) {
	return m.ScanAllSubscriptions(ctx)
}

// Check runs all readiness, compatibility, and catalog-availability checks for
// one operator without mutating the cluster (R1.1).
func (m *Migrator) Check(ctx context.Context, opts Options) (*OperatorScanResult, error) {
	opts.ApplyDefaults()
	return m.ScanSubscription(ctx, opts)
}

// findDependents returns the names of installed operators (Subscription names) whose
// bundle properties declare an olm.package.required dependency on packageName (R9).
// The spec requires a warning — not a block — when migrating an operator others depend on.
func (m *Migrator) findDependents(ctx context.Context, packageName string) []string {
	var subList operatorsv1alpha1.SubscriptionList
	if err := m.Client.List(ctx, &subList); err != nil {
		return nil
	}

	var dependents []string
	for _, sub := range subList.Items {
		if sub.Spec.Package == packageName {
			continue // skip the operator itself
		}
		if sub.Status.InstalledCSV == "" {
			continue
		}
		var csv operatorsv1alpha1.ClusterServiceVersion
		if err := m.Client.Get(ctx, client.ObjectKey{
			Name:      sub.Status.InstalledCSV,
			Namespace: sub.Namespace,
		}, &csv); err != nil {
			continue
		}
		propsJSON := csv.Annotations["operatorframework.io/properties"]
		if propsJSON == "" {
			continue
		}
		props, err := parseProperties(propsJSON)
		if err != nil {
			continue
		}
		for _, p := range props {
			if p.Type == "olm.package.required" {
				var req struct {
					PackageName string `json:"packageName"`
				}
				if err := json.Unmarshal(p.Value, &req); err == nil && req.PackageName == packageName {
					dependents = append(dependents, fmt.Sprintf("%s/%s", sub.Namespace, sub.Name))
					break
				}
			}
		}
	}
	return dependents
}

// Gather checks the target COS prerequisites and collects everything that would
// be migrated without making cluster mutations — backs convert --dry-run (R1.1).
func (m *Migrator) Gather(ctx context.Context, opts Options) (*MigrationInfo, error) {
	opts.ApplyDefaults()
	prepared, err := m.PrepareClusterObjectSet(ctx, opts)
	if err != nil {
		return nil, err
	}
	info, err := m.GatherMigrationInfo(ctx, prepared)
	if err != nil {
		return nil, err
	}
	info.SystemNamespace = prepared.SystemNamespace
	return info, nil
}

// Rollback restores an operator to OLMv0 management (R1.1).
// opts.AcknowledgeInstalled must be true when the CE is Installed=True.
func (m *Migrator) Rollback(ctx context.Context, opts Options) error {
	opts.ApplyDefaults()
	return m.RollbackClusterExtension(ctx, opts.ClusterExtensionName, opts.AcknowledgeInstalled)
}

// Cleanup finishes a partial migration in Conflict state by deleting the
// Subscription and OLMv0 artifacts, leaving the CE intact (R1.1).
func (m *Migrator) Cleanup(ctx context.Context, opts Options) error {
	opts.ApplyDefaults()
	return m.CleanupConflict(ctx, opts.ClusterExtensionName)
}
