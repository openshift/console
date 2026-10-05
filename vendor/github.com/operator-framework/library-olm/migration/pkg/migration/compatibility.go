package migration

import (
	"context"
	"encoding/json"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"

	operatorsv1 "github.com/operator-framework/api/pkg/operators/v1"
	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
)

// CheckCompatibility checks whether an operator is compatible with OLMv1
// migration under the supplied acknowledgments. Incompatible conditions appear
// in the returned report; a returned error means the check could not complete.
// It does not check Subscription readiness or target catalog availability.
func (m *Migrator) CheckCompatibility(ctx context.Context, opts Options, csv *operatorsv1alpha1.ClusterServiceVersion, bundleProperties string) (*PreMigrationReport, error) {
	report := &PreMigrationReport{}

	// OperatorGroup checks
	ogChecks, err := m.checkAllNamespacesMode(ctx, opts)
	if err != nil {
		return nil, err
	}
	report.Checks = append(report.Checks, ogChecks...)
	report.Checks = append(report.Checks, checkAllNamespacesSupported(csv))

	// Dependency checks (C2 — hard block)
	report.Checks = append(report.Checks, checkNoDependencies(bundleProperties)...)

	// APIService definitions check (C3 — hard block)
	// OLMv1 does not yet support APIService-based operators end-to-end.
	// See specs/20260821-migration-v0-to-v1/requirements.md R3 C3.
	report.Checks = append(report.Checks, checkNoAPIServices(csv))

	// OperatorCondition checks (C4)
	condCheck, err := m.checkNoOperatorConditions(ctx, opts, csv)
	if err != nil {
		return nil, err
	}
	report.Checks = append(report.Checks, condCheck)

	// OLMv0-API RBAC check (C5 — soft)
	report.Checks = append(report.Checks, checkOLMv0APIAccess(opts, csv))

	return report, nil
}

func (m *Migrator) checkAllNamespacesMode(ctx context.Context, opts Options) ([]CheckResult, error) {
	var ogList operatorsv1.OperatorGroupList
	if err := m.Client.List(ctx, &ogList, client.InNamespace(opts.SubscriptionNamespace)); err != nil {
		return nil, fmt.Errorf("failed to list OperatorGroups in %s: %w", opts.SubscriptionNamespace, err)
	}
	if len(ogList.Items) == 0 {
		return []CheckResult{{
			Name:    "OperatorGroup exists",
			Passed:  false,
			Message: fmt.Sprintf("no OperatorGroup found in namespace %s", opts.SubscriptionNamespace),
		}}, nil
	}

	og := ogList.Items[0]
	var checks []CheckResult

	// spec.serviceAccountName (C6 — soft)
	if og.Spec.ServiceAccountName != "" {
		if opts.AcknowledgeScopedServiceAccount {
			checks = append(checks, CheckResult{
				Name:    "No scoped ServiceAccount",
				Passed:  true,
				Message: "overridden: operator will use cluster-admin (scoped ServiceAccount acknowledged)",
			})
		} else {
			checks = append(checks, CheckResult{
				Name:    "No scoped ServiceAccount",
				Passed:  false,
				Message: "OperatorGroup has spec.serviceAccountName set; OLMv1 does not support scoped service accounts",
			})
		}
	} else {
		checks = append(checks, CheckResult{
			Name:    "No scoped ServiceAccount",
			Passed:  true,
			Message: "OperatorGroup does not use a scoped service account",
		})
	}

	// spec.selector — scoped namespace selector means not AllNamespaces (C1 — soft)
	if og.Spec.Selector != nil && !isEmptyLabelSelector(og.Spec.Selector) {
		if opts.AcknowledgeWatchScopeChange {
			checks = append(checks, CheckResult{
				Name:    "No namespace selector",
				Passed:  true,
				Message: "overridden: operator will run AllNamespaces post-migration (watch scope change acknowledged)",
			})
		} else {
			checks = append(checks, CheckResult{
				Name:    "No namespace selector",
				Passed:  false,
				Message: "OperatorGroup has spec.selector set; OLMv1 uses AllNamespaces — pass --acknowledge-watch-scope-change to override",
			})
		}
	} else {
		checks = append(checks, CheckResult{
			Name:    "No namespace selector",
			Passed:  true,
			Message: "OperatorGroup does not use a namespace selector",
		})
	}

	// spec.upgradeStrategy — TechPreviewUnsafeFailForward is not mapped to OLMv1 and is not
	// equivalent to SelfCertified. R6 says this is informational only: warn but do not block.
	if og.Spec.UpgradeStrategy != "" && og.Spec.UpgradeStrategy != operatorsv1.UpgradeStrategyDefault {
		checks = append(checks, CheckResult{
			Name:    "Upgrade strategy",
			Passed:  true,
			Message: fmt.Sprintf("OperatorGroup upgradeStrategy %q is not mapped to OLMv1 and will be ignored post-migration", og.Spec.UpgradeStrategy),
		})
	} else {
		checks = append(checks, CheckResult{
			Name:    "Upgrade strategy",
			Passed:  true,
			Message: "upgrade strategy is Default or unset",
		})
	}

	// spec.targetNamespaces — AllNamespaces mode (C1 — soft)
	if len(og.Spec.TargetNamespaces) > 0 {
		if opts.AcknowledgeWatchScopeChange {
			checks = append(checks, CheckResult{
				Name:    "AllNamespaces mode",
				Passed:  true,
				Message: "overridden: operator will run AllNamespaces post-migration (watch scope change acknowledged)",
			})
		} else {
			checks = append(checks, CheckResult{
				Name:    "AllNamespaces mode",
				Passed:  false,
				Message: "OperatorGroup has spec.targetNamespaces set; operator must be in AllNamespaces mode for migration",
			})
		}
	} else {
		checks = append(checks, CheckResult{
			Name:    "AllNamespaces mode",
			Passed:  true,
			Message: "operator is in AllNamespaces mode",
		})
	}

	// status.namespaces warning — single-namespace targets will become AllNamespaces (C1 — soft)
	if len(og.Status.Namespaces) == 1 && og.Status.Namespaces[0] != "" {
		if opts.AcknowledgeWatchScopeChange {
			checks = append(checks, CheckResult{
				Name:    "Namespace scope change",
				Passed:  true,
				Message: "overridden: watch scope change acknowledged",
			})
		} else {
			checks = append(checks, CheckResult{
				Name:    "Namespace scope change",
				Passed:  false,
				Message: fmt.Sprintf("OperatorGroup targets namespace %q; post-migration the operator will run in AllNamespaces mode", og.Status.Namespaces[0]),
			})
		}
	}

	return checks, nil
}

func isEmptyLabelSelector(s *metav1.LabelSelector) bool {
	return s == nil || (len(s.MatchLabels) == 0 && len(s.MatchExpressions) == 0)
}

// checkAllNamespacesSupported is a hard block: acknowledging a change in watch
// scope cannot make a bundle that only supports Own/SingleNamespace run globally.
func checkAllNamespacesSupported(csv *operatorsv1alpha1.ClusterServiceVersion) CheckResult {
	for _, mode := range csv.Spec.InstallModes {
		if mode.Type == operatorsv1alpha1.InstallModeTypeAllNamespaces && mode.Supported {
			return CheckResult{
				Name:    "AllNamespaces install mode supported",
				Passed:  true,
				Message: "CSV supports AllNamespaces install mode",
			}
		}
	}
	return CheckResult{
		Name:    "AllNamespaces install mode supported",
		Passed:  false,
		Message: "CSV does not declare AllNamespaces install mode as supported; --acknowledge-watch-scope-change cannot override bundle capabilities",
	}
}

// olmProperty represents a single entry in the operatorframework.io/properties annotation.
type olmProperty struct {
	Type  string          `json:"type"`
	Value json.RawMessage `json:"value"`
}

// parseProperties handles both bare-array and wrapped-object formats of the
// operatorframework.io/properties annotation.
func parseProperties(propertiesJSON string) ([]olmProperty, error) {
	raw := []byte(propertiesJSON)

	var props []olmProperty
	if err := json.Unmarshal(raw, &props); err == nil {
		return props, nil
	}

	var wrapped struct {
		Properties []olmProperty `json:"properties"`
	}
	if err := json.Unmarshal(raw, &wrapped); err != nil {
		return nil, err
	}
	return wrapped.Properties, nil
}

// checkNoAPIServices enforces C3 — no owned APIService definitions (hard block).
// OLMv1 does not support APIService-based operators.
func checkNoAPIServices(csv *operatorsv1alpha1.ClusterServiceVersion) CheckResult {
	if len(csv.Spec.APIServiceDefinitions.Owned) > 0 {
		return CheckResult{
			Name:    "No APIService definitions",
			Passed:  false,
			Message: "CSV has spec.apiservicedefinitions.owned set; OLMv1 does not yet fully support APIService-based operators",
		}
	}
	return CheckResult{
		Name:    "No APIService definitions",
		Passed:  true,
		Message: "CSV does not define owned APIServices",
	}
}

// checkNoDependencies enforces C2 — no olm.package.required or olm.gvk.required (hard block).
func checkNoDependencies(propertiesJSON string) []CheckResult {
	if propertiesJSON == "" {
		return []CheckResult{{
			Name:    "No dependency resolution",
			Passed:  true,
			Message: "no bundle properties declared",
		}}
	}

	props, err := parseProperties(propertiesJSON)
	if err != nil {
		return []CheckResult{{
			Name:    "No dependency resolution",
			Passed:  false,
			Message: fmt.Sprintf("failed to parse bundle properties: %v", err),
		}}
	}

	var issues []CheckResult
	for _, p := range props {
		switch p.Type {
		case "olm.package.required":
			issues = append(issues, CheckResult{
				Name:    "No dependency resolution",
				Passed:  false,
				Message: fmt.Sprintf("bundle declares olm.package.required dependency: %s", string(p.Value)),
			})
		case "olm.gvk.required":
			issues = append(issues, CheckResult{
				Name:    "No dependency resolution",
				Passed:  false,
				Message: fmt.Sprintf("bundle declares olm.gvk.required dependency: %s", string(p.Value)),
			})
		}
	}

	if len(issues) == 0 {
		return []CheckResult{{
			Name:    "No dependency resolution",
			Passed:  true,
			Message: "no olm.package.required or olm.gvk.required properties",
		}}
	}
	return issues
}

// olmv0APIResources is the set of operators.coreos.com resource names that signal OLMv0-API
// dependency (per R3 C5). operatorconditions is explicitly excluded — OLMv0 stamps that RBAC
// on every operator and its presence is not a usage signal.
var olmv0APIResources = map[string]bool{
	"subscriptions":          true,
	"installplans":           true,
	"clusterserviceversions": true,
	"catalogsources":         true,
}

// checkOLMv0APIAccess implements C5: flag operators whose clusterPermissions grant access to
// OLMv0 APIs (operators.coreos.com, excluding operatorconditions) without also granting
// equivalent OLMv1 API access (olm.operatorframework.io). Operators updated for OLMv1
// compatibility carry both sets of permissions and pass this check.
func checkOLMv0APIAccess(opts Options, csv *operatorsv1alpha1.ClusterServiceVersion) CheckResult {
	hasOLMv0Access := false
	hasOLMv1Access := false

	for _, perm := range csv.Spec.InstallStrategy.StrategySpec.ClusterPermissions {
		for _, rule := range perm.Rules {
			for _, group := range rule.APIGroups {
				switch group {
				case "operators.coreos.com":
					for _, res := range rule.Resources {
						if olmv0APIResources[res] || res == "*" {
							hasOLMv0Access = true
						}
					}
				case "olm.operatorframework.io":
					hasOLMv1Access = true
				}
			}
		}
	}

	if !hasOLMv0Access {
		return CheckResult{
			Name:    "OLMv0-API RBAC",
			Passed:  true,
			Message: "CSV clusterPermissions do not grant OLMv0 API access",
		}
	}
	if hasOLMv1Access {
		return CheckResult{
			Name:    "OLMv0-API RBAC",
			Passed:  true,
			Message: "CSV clusterPermissions grant both OLMv0 and OLMv1 API access (updated for compatibility)",
		}
	}

	// OLMv0 access without OLMv1 access — soft block
	if opts.AcknowledgeOLMv0APIAccess {
		return CheckResult{
			Name:    "OLMv0-API RBAC",
			Passed:  true,
			Message: "overridden: OLMv0 API RBAC without OLMv1 equivalent (olmv0-api-access acknowledged)",
		}
	}
	return CheckResult{
		Name:    "OLMv0-API RBAC",
		Passed:  false,
		Message: "CSV clusterPermissions grant operators.coreos.com access without OLMv1 equivalent; pass --acknowledge-olmv0-api-access to override",
	}
}

// checkNoOperatorConditions enforces C4 — no active OperatorCondition status entries.
// RBAC presence alone is NOT treated as usage; only status.conditions entries count.
func (m *Migrator) checkNoOperatorConditions(ctx context.Context, opts Options, csv *operatorsv1alpha1.ClusterServiceVersion) (CheckResult, error) {
	var oc operatorsv1.OperatorCondition
	err := m.Client.Get(ctx, types.NamespacedName{
		Name:      csv.Name,
		Namespace: opts.SubscriptionNamespace,
	}, &oc)
	if err != nil {
		if client.IgnoreNotFound(err) != nil {
			return CheckResult{}, fmt.Errorf("failed to get OperatorCondition: %w", err)
		}
		return CheckResult{
			Name:    "No OperatorCondition usage",
			Passed:  true,
			Message: "no OperatorCondition resource found",
		}, nil
	}

	if len(oc.Status.Conditions) > 0 {
		if opts.AcknowledgeOperatorCondition {
			return CheckResult{
				Name:    "No OperatorCondition usage",
				Passed:  true,
				Message: "overridden: active OperatorCondition usage acknowledged",
			}, nil
		}
		return CheckResult{
			Name:    "No OperatorCondition usage",
			Passed:  false,
			Message: "OperatorCondition has status.conditions entries; operator actively uses the OperatorCondition API",
		}, nil
	}
	return CheckResult{
		Name:    "No OperatorCondition usage",
		Passed:  true,
		Message: "OperatorCondition exists but has no status entries",
	}, nil
}
