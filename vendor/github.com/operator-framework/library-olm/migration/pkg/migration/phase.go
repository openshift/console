package migration

// PhaseSort logic is adapted from:
// https://github.com/operator-framework/operator-controller/blob/main/internal/operator-controller/applier/phase.go
// which in turn is adapted from:
// https://github.com/package-operator/package-operator/blob/v1.18.2/internal/packages/internal/packagekickstart/presets/phases.go

import (
	"cmp"
	"slices"

	"k8s.io/apimachinery/pkg/runtime/schema"

	ocv1 "github.com/operator-framework/operator-controller/api/v1"
	ocv1ac "github.com/operator-framework/operator-controller/applyconfigurations/api/v1"
)

// Phase represents a well-known deployment phase name.
type Phase string

const (
	PhaseNamespaces     Phase = "namespaces"
	PhasePolicies       Phase = "policies"
	PhaseIdentity       Phase = "identity"
	PhaseConfiguration  Phase = "configuration"
	PhaseStorage        Phase = "storage"
	PhaseCRDs           Phase = "crds"
	PhaseRoles          Phase = "roles"
	PhaseBindings       Phase = "bindings"
	PhaseInfrastructure Phase = "infrastructure"
	PhaseDeploy         Phase = "deploy"
	PhaseScaling        Phase = "scaling"
	PhasePublish        Phase = "publish"
	PhaseAdmission      Phase = "admission"
)

// defaultPhaseOrder is the ordered list of phases for rollout sequencing.
var defaultPhaseOrder = []Phase{
	PhaseNamespaces,
	PhasePolicies,
	PhaseIdentity,
	PhaseConfiguration,
	PhaseStorage,
	PhaseCRDs,
	PhaseRoles,
	PhaseBindings,
	PhaseInfrastructure,
	PhaseDeploy,
	PhaseScaling,
	PhasePublish,
	PhaseAdmission,
}

var (
	gkPhaseMap = map[schema.GroupKind]Phase{}
	phaseGKMap = map[Phase][]schema.GroupKind{
		PhaseNamespaces: {
			{Kind: "Namespace"},
		},
		PhasePolicies: {
			{Kind: "NetworkPolicy", Group: "networking.k8s.io"},
			{Kind: "PodDisruptionBudget", Group: "policy"},
			{Kind: "PriorityClass", Group: "scheduling.k8s.io"},
		},
		PhaseIdentity: {
			{Kind: "ServiceAccount"},
		},
		PhaseConfiguration: {
			{Kind: "Secret"},
			{Kind: "ConfigMap"},
		},
		PhaseStorage: {
			{Kind: "PersistentVolume"},
			{Kind: "PersistentVolumeClaim"},
			{Kind: "StorageClass", Group: "storage.k8s.io"},
		},
		PhaseCRDs: {
			{Kind: "CustomResourceDefinition", Group: "apiextensions.k8s.io"},
		},
		PhaseRoles: {
			{Kind: "ClusterRole", Group: "rbac.authorization.k8s.io"},
			{Kind: "Role", Group: "rbac.authorization.k8s.io"},
		},
		PhaseBindings: {
			{Kind: "ClusterRoleBinding", Group: "rbac.authorization.k8s.io"},
			{Kind: "RoleBinding", Group: "rbac.authorization.k8s.io"},
		},
		PhaseInfrastructure: {
			{Kind: "Service"},
			{Kind: "Issuer", Group: "cert-manager.io"},
			{Kind: "Certificate", Group: "cert-manager.io"},
		},
		PhaseDeploy: {
			{Kind: "Deployment", Group: "apps"},
		},
		PhaseScaling: {
			{Kind: "VerticalPodAutoscaler", Group: "autoscaling.k8s.io"},
		},
		PhasePublish: {
			{Kind: "PrometheusRule", Group: "monitoring.coreos.com"},
			{Kind: "ServiceMonitor", Group: "monitoring.coreos.com"},
			{Kind: "PodMonitor", Group: "monitoring.coreos.com"},
			{Kind: "Ingress", Group: "networking.k8s.io"},
			{Kind: "Route", Group: "route.openshift.io"},
			{Kind: "ConsoleYAMLSample", Group: "console.openshift.io"},
			{Kind: "ConsoleQuickStart", Group: "console.openshift.io"},
			{Kind: "ConsoleCLIDownload", Group: "console.openshift.io"},
			{Kind: "ConsoleLink", Group: "console.openshift.io"},
			{Kind: "ConsolePlugin", Group: "console.openshift.io"},
		},
		PhaseAdmission: {
			{Kind: "ValidatingWebhookConfiguration", Group: "admissionregistration.k8s.io"},
			{Kind: "MutatingWebhookConfiguration", Group: "admissionregistration.k8s.io"},
		},
	}
)

func init() {
	for phase, gks := range phaseGKMap {
		for _, gk := range gks {
			gkPhaseMap[gk] = phase
		}
	}
}

func determinePhase(gk schema.GroupKind) Phase {
	phase, ok := gkPhaseMap[gk]
	if !ok {
		return PhaseDeploy
	}
	return phase
}

func compareObjects(a, b ocv1ac.ClusterObjectSetObjectApplyConfiguration) int {
	var aGVK, bGVK schema.GroupVersionKind
	if a.Object != nil {
		aGVK = a.Object.GroupVersionKind()
	}
	if b.Object != nil {
		bGVK = b.Object.GroupVersionKind()
	}
	var aNs, bNs, aName, bName string
	if a.Object != nil {
		aNs = a.Object.GetNamespace()
		aName = a.Object.GetName()
	}
	if b.Object != nil {
		bNs = b.Object.GetNamespace()
		bName = b.Object.GetName()
	}
	return cmp.Or(
		cmp.Compare(aGVK.Group, bGVK.Group),
		cmp.Compare(aGVK.Version, bGVK.Version),
		cmp.Compare(aGVK.Kind, bGVK.Kind),
		cmp.Compare(aNs, bNs),
		cmp.Compare(aName, bName),
	)
}

// PhaseSort takes an unsorted list of objects and organizes them into sorted phases
// for use in a ClusterObjectSet spec.
func PhaseSort(unsortedObjs []ocv1ac.ClusterObjectSetObjectApplyConfiguration) []*ocv1ac.ClusterObjectSetPhaseApplyConfiguration {
	phaseMap := make(map[Phase][]ocv1ac.ClusterObjectSetObjectApplyConfiguration)

	for _, obj := range unsortedObjs {
		var gk schema.GroupKind
		if obj.Object != nil {
			gk = obj.Object.GroupVersionKind().GroupKind()
		}
		phase := determinePhase(gk)
		phaseMap[phase] = append(phaseMap[phase], obj)
	}

	var phasesSorted []*ocv1ac.ClusterObjectSetPhaseApplyConfiguration
	for _, phaseName := range defaultPhaseOrder {
		objs, ok := phaseMap[phaseName]
		if !ok {
			continue
		}
		slices.SortFunc(objs, compareObjects)

		objPtrs := make([]*ocv1ac.ClusterObjectSetObjectApplyConfiguration, len(objs))
		for i := range objs {
			objPtrs[i] = &objs[i]
		}

		cp := ocv1.CollisionProtectionNone
		phasesSorted = append(phasesSorted, ocv1ac.ClusterObjectSetPhase().
			WithName(string(phaseName)).
			WithCollisionProtection(cp).
			WithObjects(objPtrs...))
	}

	return phasesSorted
}
