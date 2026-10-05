package migration

import (
	"context"
	"encoding/json"
	"fmt"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"

	operatorsv1 "github.com/operator-framework/api/pkg/operators/v1"
	operatorsv1alpha1 "github.com/operator-framework/api/pkg/operators/v1alpha1"
)

// possibleResourceGVKs lists all resource GVKs that may be part of an OLMv0 operator installation.
// Namespace is included because some operators create namespaces as part of their bundle resources
// (e.g. to set up a dedicated tenant namespace); these will be collected if labeled appropriately.
var possibleResourceGVKs = []schema.GroupVersionKind{
	{Group: "", Version: "v1", Kind: "Namespace"},
	{Group: "", Version: "v1", Kind: "Secret"},
	{Group: "", Version: "v1", Kind: "ConfigMap"},
	{Group: "", Version: "v1", Kind: "ServiceAccount"},
	{Group: "", Version: "v1", Kind: "Service"},
	{Group: "apps", Version: "v1", Kind: "Deployment"},
	{Group: "rbac.authorization.k8s.io", Version: "v1", Kind: "ClusterRole"},
	{Group: "rbac.authorization.k8s.io", Version: "v1", Kind: "ClusterRoleBinding"},
	{Group: "rbac.authorization.k8s.io", Version: "v1", Kind: "Role"},
	{Group: "rbac.authorization.k8s.io", Version: "v1", Kind: "RoleBinding"},
	{Group: "apiextensions.k8s.io", Version: "v1", Kind: "CustomResourceDefinition"},
	{Group: "admissionregistration.k8s.io", Version: "v1", Kind: "ValidatingWebhookConfiguration"},
	{Group: "admissionregistration.k8s.io", Version: "v1", Kind: "MutatingWebhookConfiguration"},
	{Group: "monitoring.coreos.com", Version: "v1", Kind: "PrometheusRule"},
	{Group: "monitoring.coreos.com", Version: "v1", Kind: "ServiceMonitor"},
	{Group: "monitoring.coreos.com", Version: "v1", Kind: "PodMonitor"},
	{Group: "policy", Version: "v1", Kind: "PodDisruptionBudget"},
	{Group: "scheduling.k8s.io", Version: "v1", Kind: "PriorityClass"},
	{Group: "networking.k8s.io", Version: "v1", Kind: "NetworkPolicy"},
	{Group: "autoscaling.k8s.io", Version: "v1", Kind: "VerticalPodAutoscaler"},
	{Group: "console.openshift.io", Version: "v1", Kind: "ConsoleYAMLSample"},
	{Group: "console.openshift.io", Version: "v1", Kind: "ConsoleQuickStart"},
	{Group: "console.openshift.io", Version: "v1", Kind: "ConsoleCLIDownload"},
	{Group: "console.openshift.io", Version: "v1", Kind: "ConsoleLink"},
	{Group: "console.openshift.io", Version: "v1", Kind: "ConsolePlugin"},
}

// clusterScopedKinds is the set of kinds that are cluster-scoped (no namespace in lookups).
var clusterScopedKinds = map[string]bool{
	"Namespace":                      true,
	"ClusterRole":                    true,
	"ClusterRoleBinding":             true,
	"CustomResourceDefinition":       true,
	"PriorityClass":                  true,
	"ConsoleYAMLSample":              true,
	"ConsoleQuickStart":              true,
	"ConsoleCLIDownload":             true,
	"ConsoleLink":                    true,
	"ConsolePlugin":                  true,
	"ValidatingWebhookConfiguration": true,
	"MutatingWebhookConfiguration":   true,
}

// olmv0OnlyKinds lists OLMv0 management resource kinds excluded from the COS.
// These are cleaned up separately and must not be placed under OLMv1 management.
var olmv0OnlyKinds = map[string]bool{
	"ClusterServiceVersion": true,
	"Subscription":          true,
	"InstallPlan":           true,
	"Operator":              true,
	"OperatorGroup":         true,
	"OperatorCondition":     true,
}

// GetCSVAndInstallPlan retrieves the Subscription, CSV, and InstallPlan.
func (m *Migrator) GetCSVAndInstallPlan(ctx context.Context, opts Options) (*operatorsv1alpha1.Subscription, *operatorsv1alpha1.ClusterServiceVersion, *operatorsv1alpha1.InstallPlan, error) {
	var sub operatorsv1alpha1.Subscription
	if err := m.Client.Get(ctx, types.NamespacedName{
		Name:      opts.SubscriptionName,
		Namespace: opts.SubscriptionNamespace,
	}, &sub); err != nil {
		return nil, nil, nil, fmt.Errorf("failed to get Subscription: %w", err)
	}

	csvName := sub.Status.InstalledCSV
	if csvName == "" {
		return nil, nil, nil, fmt.Errorf("subscription has no installedCSV")
	}

	var csv operatorsv1alpha1.ClusterServiceVersion
	if err := m.Client.Get(ctx, types.NamespacedName{
		Name:      csvName,
		Namespace: opts.SubscriptionNamespace,
	}, &csv); err != nil {
		return nil, nil, nil, fmt.Errorf("failed to get CSV %s: %w", csvName, err)
	}

	var ip *operatorsv1alpha1.InstallPlan
	ipName, ipNamespace := "", sub.Namespace
	if sub.Status.InstallPlanRef != nil {
		ipName = sub.Status.InstallPlanRef.Name
		if sub.Status.InstallPlanRef.Namespace != "" {
			ipNamespace = sub.Status.InstallPlanRef.Namespace
		}
	} else if sub.Status.Install != nil {
		// Fallback to the deprecated status.install field (R4).
		// TODO: remove this fallback if the deprecated field is removed from the API.
		ipName = sub.Status.Install.Name
	}
	if ipName != "" {
		ip = &operatorsv1alpha1.InstallPlan{}
		if err := m.Client.Get(ctx, types.NamespacedName{
			Name:      ipName,
			Namespace: ipNamespace,
		}, ip); err != nil {
			return nil, nil, nil, fmt.Errorf("failed to get InstallPlan %s: %w", ipName, err)
		}
	}

	return &sub, &csv, ip, nil
}

// GetBundleInfo extracts bundle metadata from the Subscription and CSV.
func (m *Migrator) GetBundleInfo(ctx context.Context, opts Options, csv *operatorsv1alpha1.ClusterServiceVersion, ip *operatorsv1alpha1.InstallPlan) (*MigrationInfo, error) {
	var sub operatorsv1alpha1.Subscription
	if err := m.Client.Get(ctx, types.NamespacedName{
		Name:      opts.SubscriptionName,
		Namespace: opts.SubscriptionNamespace,
	}, &sub); err != nil {
		return nil, fmt.Errorf("failed to get Subscription: %w", err)
	}
	if err := m.validateSubscriptionCatalogSource(ctx, &sub); err != nil {
		return nil, err
	}

	info := &MigrationInfo{
		PackageName:    sub.Spec.Package,
		Channel:        sub.Spec.Channel,
		ManualApproval: sub.Spec.InstallPlanApproval == operatorsv1alpha1.ApprovalManual,
		CatalogSourceRef: types.NamespacedName{
			Name:      sub.Spec.CatalogSource,
			Namespace: sub.Spec.CatalogSourceNamespace,
		},
	}

	info.BundleName = csv.Name
	info.Version = parseCSVVersion(csv)

	// R4: spec.config → CE deploymentConfig. Drop spec.config.selector (never honored in
	// OLMv0; no CE equivalent) and warn if it was set.
	if sub.Spec.Config != nil {
		cfg := sub.Spec.Config.DeepCopy()
		if cfg.Selector != nil {
			m.progress(ProgressEvent{Step: ProgressStepCollect, Status: ProgressWarning, Message: "Subscription spec.config.selector is not supported by OLMv1 and will be dropped during migration"})
			cfg.Selector = nil
		}
		info.SubscriptionConfig = cfg
	}

	if ip != nil {
		for _, bl := range ip.Status.BundleLookups {
			if bl.Identifier == csv.Name {
				info.BundleImage = bl.Path
				if bl.CatalogSourceRef != nil {
					info.CatalogSourceRef = types.NamespacedName{
						Name:      bl.CatalogSourceRef.Name,
						Namespace: bl.CatalogSourceRef.Namespace,
					}
				}
				break
			}
		}
	}

	return info, nil
}

// validateSubscriptionCatalogSource rejects sources that cannot be represented
// as OLMv1 image-backed ClusterCatalogs, even when another catalog serves the
// same package. Check the Subscription reference, not an InstallPlan fallback.
func (m *Migrator) validateSubscriptionCatalogSource(ctx context.Context, sub *operatorsv1alpha1.Subscription) error {
	ref := types.NamespacedName{Name: sub.Spec.CatalogSource, Namespace: sub.Spec.CatalogSourceNamespace}
	var cs operatorsv1alpha1.CatalogSource
	if err := m.Client.Get(ctx, ref, &cs); err != nil {
		return fmt.Errorf("subscription %s/%s references CatalogSource %s: %w", sub.Namespace, sub.Name, ref, err)
	}
	if cs.Spec.SourceType != operatorsv1alpha1.SourceTypeGrpc || cs.Spec.Image == "" {
		return fmt.Errorf("subscription %s/%s references non-image CatalogSource %s (sourceType %q, spec.image %q); only grpc CatalogSources with spec.image can be migrated", sub.Namespace, sub.Name, ref, cs.Spec.SourceType, cs.Spec.Image)
	}
	return nil
}

// parseCSVVersion extracts the version from the CSV's operatorframework.io/properties annotation.
func parseCSVVersion(csv *operatorsv1alpha1.ClusterServiceVersion) string {
	propsJSON := csv.Annotations["operatorframework.io/properties"]
	if propsJSON == "" {
		return csv.Spec.Version.String()
	}

	props, err := parseProperties(propsJSON)
	if err != nil {
		return csv.Spec.Version.String()
	}

	for _, p := range props {
		if p.Type == "olm.package" {
			var pkg struct {
				PackageName string `json:"packageName"`
				Version     string `json:"version"`
			}
			if err := json.Unmarshal(p.Value, &pkg); err == nil && pkg.Version != "" {
				return pkg.Version
			}
		}
	}
	return csv.Spec.Version.String()
}

// GetCatalogSourceImage retrieves the image reference from the CatalogSource spec.
func (m *Migrator) GetCatalogSourceImage(ctx context.Context, csRef types.NamespacedName) (string, error) {
	var cs operatorsv1alpha1.CatalogSource
	if err := m.Client.Get(ctx, csRef, &cs); err != nil {
		return "", fmt.Errorf("failed to get CatalogSource %s/%s: %w", csRef.Namespace, csRef.Name, err)
	}
	if cs.Spec.SourceType != operatorsv1alpha1.SourceTypeGrpc || cs.Spec.Image == "" {
		return "", fmt.Errorf("CatalogSource %s/%s is not an image-backed grpc source (sourceType %q, spec.image %q)", csRef.Namespace, csRef.Name, cs.Spec.SourceType, cs.Spec.Image)
	}
	return cs.Spec.Image, nil
}

// CollectResources gathers all resources belonging to the operator using multiple collection strategies.
func (m *Migrator) CollectResources(ctx context.Context, opts Options, csv *operatorsv1alpha1.ClusterServiceVersion, ip *operatorsv1alpha1.InstallPlan, packageName string) ([]unstructured.Unstructured, error) {
	seen := make(map[string]bool)
	var collected []unstructured.Unstructured

	addIfNew := func(obj unstructured.Unstructured) {
		if olmv0OnlyKinds[obj.GetKind()] {
			return
		}
		key := resourceKey(obj)
		if !seen[key] {
			seen[key] = true
			collected = append(collected, obj)
		}
	}

	// Strategy 1: Operator CR status.components.refs (primary)
	fromOperatorCR, _ := m.gatherResourcesFromOperatorCR(ctx, packageName, opts.SubscriptionNamespace)
	for _, obj := range fromOperatorCR {
		addIfNew(obj)
	}

	// Strategy 2: CRDs by package label
	crds, err := m.getCRDsByPackage(ctx, opts, packageName)
	if err != nil {
		return nil, fmt.Errorf("failed to collect CRDs by package: %w", err)
	}
	for _, obj := range crds {
		addIfNew(obj)
	}

	// Strategy 3: Resources by olm.owner label
	for _, obj := range m.gatherResourcesByOwnerLabel(ctx, csv.Name) {
		addIfNew(obj)
	}

	// Strategy 4: Resources by ownerReference in the subscription namespace
	for _, obj := range m.gatherResourcesByOwnerRef(ctx, opts.SubscriptionNamespace, csv.Name) {
		addIfNew(obj)
	}

	// Strategy 5: Resources from InstallPlan steps
	if ip != nil {
		for _, obj := range m.gatherResourcesFromInstallPlan(ctx, ip, csv.Name) {
			addIfNew(obj)
		}
	}

	return collected, nil
}

// resourceKey produces a dedup key that is stable across API version aliases.
// APIVersion is intentionally excluded: the same resource may be returned from
// different collection sources using different version strings (e.g. "v1" vs
// "core/v1"), and including it would prevent correct deduplication (R5).
func resourceKey(obj unstructured.Unstructured) string {
	gvk := obj.GetObjectKind().GroupVersionKind()
	// Kubernetes core resources are conventionally represented as either "v1"
	// or "core/v1" by different discovery and unstructured-client paths. Treat
	// those spellings as the same API group so collection sources deduplicate.
	if gvk.Group == "core" {
		gvk.Group = ""
	}
	return fmt.Sprintf("%s/%s/%s/%s",
		gvk.Group,
		gvk.Kind,
		obj.GetNamespace(),
		obj.GetName())
}

func (m *Migrator) getCRDsByPackage(ctx context.Context, opts Options, packageName string) ([]unstructured.Unstructured, error) {
	packageLabel := fmt.Sprintf("operators.coreos.com/%s.%s", packageName, opts.SubscriptionNamespace)

	var crdList unstructured.UnstructuredList
	crdList.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "apiextensions.k8s.io",
		Version: "v1",
		Kind:    "CustomResourceDefinitionList",
	})

	if err := m.Client.List(ctx, &crdList,
		client.MatchingLabels{
			"olm.managed": "true",
			packageLabel:  "",
		},
	); err != nil {
		return nil, err
	}
	return crdList.Items, nil
}

func (m *Migrator) gatherResourcesByOwnerLabel(ctx context.Context, ownerName string) []unstructured.Unstructured {
	var result []unstructured.Unstructured

	for _, gvk := range possibleResourceGVKs {
		var list unstructured.UnstructuredList
		list.SetGroupVersionKind(schema.GroupVersionKind{
			Group:   gvk.Group,
			Version: gvk.Version,
			Kind:    gvk.Kind + "List",
		})

		// R5: match on olm.owner=<csv-name> only. The spec does not require
		// olm.managed=true; adding it would miss resources that carry olm.owner
		// but were not stamped with the managed label.
		if err := m.Client.List(ctx, &list,
			client.MatchingLabels{"olm.owner": ownerName},
		); err != nil {
			continue
		}
		result = append(result, list.Items...)
	}
	return result
}

func (m *Migrator) gatherResourcesByOwnerRef(ctx context.Context, namespace string, ownerName string) []unstructured.Unstructured {
	var result []unstructured.Unstructured

	for _, gvk := range possibleResourceGVKs {
		if clusterScopedKinds[gvk.Kind] {
			continue
		}

		var list unstructured.UnstructuredList
		list.SetGroupVersionKind(schema.GroupVersionKind{
			Group:   gvk.Group,
			Version: gvk.Version,
			Kind:    gvk.Kind + "List",
		})

		if err := m.Client.List(ctx, &list, client.InNamespace(namespace)); err != nil {
			continue
		}

		for _, obj := range list.Items {
			for _, ref := range obj.GetOwnerReferences() {
				if ref.Kind == "ClusterServiceVersion" && ref.Name == ownerName {
					result = append(result, obj)
					break
				}
			}
		}
	}
	return result
}

func (m *Migrator) gatherResourcesFromInstallPlan(ctx context.Context, ip *operatorsv1alpha1.InstallPlan, csvName string) []unstructured.Unstructured {
	var result []unstructured.Unstructured

	for _, step := range ip.Status.Plan {
		if step == nil || step.Resolving != csvName {
			continue
		}

		res := step.Resource
		if res.Kind == "ClusterServiceVersion" || res.Kind == "Subscription" || res.Kind == "InstallPlan" {
			continue
		}

		obj := &unstructured.Unstructured{}
		obj.SetGroupVersionKind(schema.GroupVersionKind{
			Group:   res.Group,
			Version: res.Version,
			Kind:    res.Kind,
		})

		nn := types.NamespacedName{Name: res.Name}
		if !clusterScopedKinds[res.Kind] {
			nn.Namespace = ip.Namespace
		}

		if err := m.Client.Get(ctx, nn, obj); err != nil {
			continue
		}
		result = append(result, *obj)
	}
	return result
}

// gatherResourcesFromOperatorCR collects resources from the Operator CR's status.components.refs.
func (m *Migrator) gatherResourcesFromOperatorCR(ctx context.Context, packageName, namespace string) ([]unstructured.Unstructured, error) {
	op, err := m.GetOperatorCR(ctx, packageName, namespace)
	if err != nil {
		return nil, err
	}

	if op.Status.Components == nil {
		return nil, nil
	}

	var result []unstructured.Unstructured
	for _, ref := range op.Status.Components.Refs {
		if ref.ObjectReference == nil {
			continue
		}
		if olmv0OnlyKinds[ref.Kind] {
			continue
		}

		obj := &unstructured.Unstructured{}
		obj.SetGroupVersionKind(schema.GroupVersionKind{
			Group:   ref.GroupVersionKind().Group,
			Version: ref.GroupVersionKind().Version,
			Kind:    ref.Kind,
		})

		nn := types.NamespacedName{Name: ref.Name}
		if ref.Namespace != "" {
			nn.Namespace = ref.Namespace
		}

		if err := m.Client.Get(ctx, nn, obj); err != nil {
			continue
		}
		result = append(result, *obj)
	}
	return result, nil
}

// GatherMigrationInfo profiles a Subscription and collects candidate resources
// without mutation. Like Gather, it does not run the full eligibility,
// catalog-resolution, or target preflight checks required before conversion.
func (m *Migrator) GatherMigrationInfo(ctx context.Context, opts Options) (*MigrationInfo, error) {
	_, csv, ip, err := m.GetCSVAndInstallPlan(ctx, opts)
	if err != nil {
		return nil, err
	}

	info, err := m.validatedBundleInfo(ctx, opts, csv, ip)
	if err != nil {
		return nil, err
	}

	objects, err := m.CollectResources(ctx, opts, csv, ip, info.PackageName)
	if err != nil {
		return nil, err
	}
	info.CollectedObjects = objects

	return info, nil
}

// validatedBundleInfo resolves the CatalogSource actually used for the installed
// bundle and verifies that it can be represented by an OLMv1 ClusterCatalog.
// An InstallPlan BundleLookup may differ from Subscription.spec.source.
func (m *Migrator) validatedBundleInfo(ctx context.Context, opts Options, csv *operatorsv1alpha1.ClusterServiceVersion, ip *operatorsv1alpha1.InstallPlan) (*MigrationInfo, error) {
	info, err := m.GetBundleInfo(ctx, opts, csv, ip)
	if err != nil {
		return nil, err
	}

	csImage, err := m.GetCatalogSourceImage(ctx, info.CatalogSourceRef)
	if err != nil {
		return nil, fmt.Errorf("failed to validate effective CatalogSource %s: %w", info.CatalogSourceRef, err)
	}
	info.CatalogSourceImage = csImage
	return info, nil
}

// GetOperatorCR retrieves the Operator CR for the given package and namespace.
func (m *Migrator) GetOperatorCR(ctx context.Context, packageName, namespace string) (*operatorsv1.Operator, error) {
	operatorName := fmt.Sprintf("%s.%s", packageName, namespace)
	var op operatorsv1.Operator
	if err := m.Client.Get(ctx, types.NamespacedName{Name: operatorName}, &op); err != nil {
		return nil, err
	}
	return &op, nil
}
