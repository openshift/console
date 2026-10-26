package migration

import (
	"context"
	"fmt"

	"k8s.io/apimachinery/pkg/types"

	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
)

// CheckReadiness checks Subscription state, CSV health, package uniqueness,
// dependency ownership, and the ClusterObjectSet API without modifying the
// cluster. Failed prerequisites appear in the returned report; a returned
// error means the check itself could not be completed. Compatibility and
// catalog availability are checked separately.
func (m *Migrator) CheckReadiness(ctx context.Context, opts Options) (*PreMigrationReport, error) {
	report := &PreMigrationReport{}
	if err := m.ensureClusterObjectSetCRD(ctx); err != nil {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "ClusterObjectSet API",
			Passed:  false,
			Message: err.Error(),
		})
	} else {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "ClusterObjectSet API",
			Passed:  true,
			Message: "ClusterObjectSet CRD is established",
		})
	}

	var sub operatorsv1alpha1.Subscription
	if err := m.Client.Get(ctx, types.NamespacedName{
		Name:      opts.SubscriptionName,
		Namespace: opts.SubscriptionNamespace,
	}, &sub); err != nil {
		return nil, fmt.Errorf("failed to get Subscription %s/%s: %w", opts.SubscriptionNamespace, opts.SubscriptionName, err)
	}

	// Subscription state (C8 — soft; same flag as CSV health)
	if sub.Status.State == operatorsv1alpha1.SubscriptionStateAtLatest ||
		sub.Status.State == operatorsv1alpha1.SubscriptionStateUpgradePending {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "Subscription state",
			Passed:  true,
			Message: fmt.Sprintf("state is %q", sub.Status.State),
		})
	} else if opts.AcknowledgeNotSteadyState {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "Subscription state",
			Passed:  true,
			Message: fmt.Sprintf("overridden: Subscription state is %q (not steady state acknowledged)", sub.Status.State),
		})
	} else {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "Subscription state",
			Passed:  false,
			Message: fmt.Sprintf("must be %q or %q, got %q; pass --acknowledge-not-steady-state to override", operatorsv1alpha1.SubscriptionStateAtLatest, operatorsv1alpha1.SubscriptionStateUpgradePending, sub.Status.State),
		})
	}

	// installedCSV
	if sub.Status.InstalledCSV != "" {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "Installed CSV",
			Passed:  true,
			Message: sub.Status.InstalledCSV,
		})
	} else {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "Installed CSV",
			Passed:  false,
			Message: "no installedCSV set",
		})
	}

	// olm.generated-by — auto-generated dependency Subscriptions must not be individually migrated
	if _, ok := sub.Annotations["olm.generated-by"]; ok {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "Not a dependency",
			Passed:  false,
			Message: "olm.generated-by annotation present — operator is an OLMv0-managed dependency of another operator; do not migrate individually",
		})
	} else {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "Not a dependency",
			Passed:  true,
			Message: "no olm.generated-by annotation",
		})
	}

	// Uniqueness — no other Subscription should reference the same package
	var subList operatorsv1alpha1.SubscriptionList
	if err := m.Client.List(ctx, &subList); err != nil {
		return nil, fmt.Errorf("failed to list Subscriptions: %w", err)
	}
	duplicate := false
	for _, other := range subList.Items {
		if other.Name == sub.Name && other.Namespace == sub.Namespace {
			continue
		}
		if other.Spec.Package == sub.Spec.Package {
			report.Checks = append(report.Checks, CheckResult{
				Name:    "Package uniqueness",
				Passed:  false,
				Message: fmt.Sprintf("another Subscription %s/%s references the same package %q", other.Namespace, other.Name, sub.Spec.Package),
			})
			duplicate = true
			break
		}
	}
	if !duplicate {
		report.Checks = append(report.Checks, CheckResult{
			Name:    "Package uniqueness",
			Passed:  true,
			Message: fmt.Sprintf("no other Subscription references package %q", sub.Spec.Package),
		})
	}

	// CSV phase and reason
	if sub.Status.InstalledCSV != "" { //nolint:nestif
		csvName := sub.Status.InstalledCSV
		var csv operatorsv1alpha1.ClusterServiceVersion
		if err := m.Client.Get(ctx, types.NamespacedName{
			Name:      csvName,
			Namespace: opts.SubscriptionNamespace,
		}, &csv); err != nil {
			report.Checks = append(report.Checks, CheckResult{
				Name:    "CSV health",
				Passed:  false,
				Message: fmt.Sprintf("failed to get CSV %s: %v", csvName, err),
			})
		} else if csv.Status.Phase != operatorsv1alpha1.CSVPhaseSucceeded {
			if opts.AcknowledgeNotSteadyState {
				report.Checks = append(report.Checks, CheckResult{
					Name:    "CSV health",
					Passed:  true,
					Message: fmt.Sprintf("overridden: phase is %q (not at steady state acknowledged)", csv.Status.Phase),
				})
			} else {
				report.Checks = append(report.Checks, CheckResult{
					Name:    "CSV health",
					Passed:  false,
					Message: fmt.Sprintf("phase is %q, expected %q", csv.Status.Phase, operatorsv1alpha1.CSVPhaseSucceeded),
				})
			}
		} else if csv.Status.Reason != operatorsv1alpha1.CSVReasonInstallSuccessful {
			if opts.AcknowledgeNotSteadyState {
				report.Checks = append(report.Checks, CheckResult{
					Name:    "CSV health",
					Passed:  true,
					Message: fmt.Sprintf("overridden: reason is %q (not at steady state acknowledged)", csv.Status.Reason),
				})
			} else {
				report.Checks = append(report.Checks, CheckResult{
					Name:    "CSV health",
					Passed:  false,
					Message: fmt.Sprintf("reason is %q, expected %q", csv.Status.Reason, operatorsv1alpha1.CSVReasonInstallSuccessful),
				})
			}
		} else {
			report.Checks = append(report.Checks, CheckResult{
				Name:    "CSV health",
				Passed:  true,
				Message: fmt.Sprintf("phase: %s, reason: %s", csv.Status.Phase, csv.Status.Reason),
			})
		}
	}

	return report, nil
}
