package main

import (
	"fmt"
	"regexp"
	"sort"
	"strings"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

const (
	managedByLabel = "app.kubernetes.io/managed-by"
	managedByValue = "web-terminal-routing"
	// devWorkspaceIDLabel is the label the DevWorkspace Operator puts on its
	// own workspace objects. Our objects carry it as well so `kubectl get
	// -l controller.devfile.io/devworkspace_id=...` finds them; the
	// operator's restricted-access webhook only blocks objects that also
	// carry the restricted-access annotation, which ours never do.
	devWorkspaceIDLabel = "controller.devfile.io/devworkspace_id"
	startedAnnotation   = "controller.devfile.io/devworkspace-started"

	// servingCertMountPath is where web-terminal-exec (and che-machine-exec)
	// read tls.crt and tls.key. On OpenShift the operator's cluster-tls
	// solver mounts the service-CA secret here.
	servingCertMountPath = "/var/serving-cert/"
)

// Issuer is the cert-manager issuer that signs workspace serving certificates.
type Issuer struct {
	Name string
	Kind string // Issuer or ClusterIssuer
}

// endpoint is the subset of a DevWorkspaceRouting endpoint that routing needs.
type endpoint struct {
	Name       string
	TargetPort int64
	Exposure   string
	Attributes map[string]interface{}
}

// desiredState is everything one DevWorkspaceRouting should produce.
type desiredState struct {
	// Service and Certificate are nil when no endpoint needs exposing.
	Service     *unstructured.Unstructured
	Certificate *unstructured.Unstructured
	// SecretName is the Secret cert-manager writes and the pod mounts.
	SecretName string
	// Status is the DevWorkspaceRouting status to report once the
	// certificate is ready.
	Status map[string]interface{}
}

func serviceName(workspaceID string) string { return workspaceID + "-service" }

func servingCertVolumeName(svc string) string { return "devworkspace-serving-cert-" + svc }

// endpointsByMachine parses spec.endpoints (machine name -> endpoint list).
func endpointsByMachine(dwr *unstructured.Unstructured) (map[string][]endpoint, error) {
	raw, _, err := unstructured.NestedMap(dwr.Object, "spec", "endpoints")
	if err != nil {
		return nil, fmt.Errorf("spec.endpoints: %w", err)
	}
	out := map[string][]endpoint{}
	for machine, list := range raw {
		items, ok := list.([]interface{})
		if !ok {
			return nil, fmt.Errorf("spec.endpoints.%s is not a list", machine)
		}
		for _, item := range items {
			m, ok := item.(map[string]interface{})
			if !ok {
				return nil, fmt.Errorf("spec.endpoints.%s has a non-object item", machine)
			}
			ep := endpoint{}
			ep.Name, _, _ = unstructured.NestedString(m, "name")
			ep.Exposure, _, _ = unstructured.NestedString(m, "exposure")
			ep.Attributes, _, _ = unstructured.NestedMap(m, "attributes")
			port, found, err := unstructured.NestedFieldNoCopy(m, "targetPort")
			if err != nil || !found {
				return nil, fmt.Errorf("endpoint %q has no targetPort", ep.Name)
			}
			switch p := port.(type) {
			case int64:
				ep.TargetPort = p
			case float64:
				ep.TargetPort = int64(p)
			default:
				return nil, fmt.Errorf("endpoint %q has a non-integer targetPort", ep.Name)
			}
			out[machine] = append(out[machine], ep)
		}
	}
	return out, nil
}

func exposed(ep endpoint) bool {
	// Same rule as the operator's cluster solvers: "none" is never exposed;
	// "public" and "internal" (the default) get a port on the service.
	return ep.Exposure != "none"
}

// desired computes the Service, Certificate and status for a routing object.
// It mirrors the DevWorkspace Operator's ClusterSolver with TLS (the solver
// behind the cluster-tls and web-terminal classes on OpenShift), with
// cert-manager in place of the OpenShift service CA.
func desired(dwr *unstructured.Unstructured, issuer Issuer) (*desiredState, error) {
	workspaceID, _, _ := unstructured.NestedString(dwr.Object, "spec", "devworkspaceId")
	if workspaceID == "" {
		return nil, fmt.Errorf("spec.devworkspaceId is empty")
	}
	selector, _, err := unstructured.NestedStringMap(dwr.Object, "spec", "podSelector")
	if err != nil {
		return nil, fmt.Errorf("spec.podSelector: %w", err)
	}
	if len(selector) == 0 {
		return nil, fmt.Errorf("spec.podSelector is empty")
	}
	machines, err := endpointsByMachine(dwr)
	if err != nil {
		return nil, err
	}

	ns := dwr.GetNamespace()
	svc := serviceName(workspaceID)
	owner := map[string]interface{}{
		"apiVersion":         dwr.GetAPIVersion(),
		"kind":               dwr.GetKind(),
		"name":               dwr.GetName(),
		"uid":                string(dwr.GetUID()),
		"controller":         true,
		"blockOwnerDeletion": false,
	}
	labels := map[string]interface{}{
		managedByLabel:      managedByValue,
		devWorkspaceIDLabel: workspaceID,
	}

	// One port per distinct target port, in a stable order.
	var machineNames []string
	for m := range machines {
		machineNames = append(machineNames, m)
	}
	sort.Strings(machineNames)
	seen := map[int64]bool{}
	var ports []interface{}
	for _, m := range machineNames {
		for _, ep := range machines[m] {
			if !exposed(ep) || seen[ep.TargetPort] {
				continue
			}
			seen[ep.TargetPort] = true
			ports = append(ports, map[string]interface{}{
				"name":       endpointPortName(ep.Name),
				"protocol":   "TCP",
				"port":       ep.TargetPort,
				"targetPort": ep.TargetPort,
			})
		}
	}

	state := &desiredState{SecretName: svc}
	exposedEndpoints := map[string]interface{}{}
	for _, m := range machineNames {
		var list []interface{}
		for _, ep := range machines[m] {
			if !exposed(ep) {
				continue
			}
			item := map[string]interface{}{
				"name": ep.Name,
				"url":  fmt.Sprintf("https://%s.%s.svc:%d", svc, ns, ep.TargetPort),
			}
			if len(ep.Attributes) > 0 {
				item["attributes"] = ep.Attributes
			}
			list = append(list, item)
		}
		if len(list) > 0 {
			exposedEndpoints[m] = list
		}
	}

	status := map[string]interface{}{
		"phase":            "Ready",
		"message":          "DevWorkspaceRouting prepared",
		"exposedEndpoints": exposedEndpoints,
	}
	if len(ports) == 0 {
		state.Status = status
		return state, nil
	}

	selectorObj := map[string]interface{}{}
	for k, v := range selector {
		selectorObj[k] = v
	}
	state.Service = &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "v1",
		"kind":       "Service",
		"metadata": map[string]interface{}{
			"name":            svc,
			"namespace":       ns,
			"labels":          labels,
			"ownerReferences": []interface{}{owner},
		},
		"spec": map[string]interface{}{
			"type":     "ClusterIP",
			"selector": selectorObj,
			"ports":    ports,
		},
	}}
	state.Certificate = &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "cert-manager.io/v1",
		"kind":       "Certificate",
		"metadata": map[string]interface{}{
			"name":            svc,
			"namespace":       ns,
			"labels":          labels,
			"ownerReferences": []interface{}{owner},
		},
		"spec": map[string]interface{}{
			"secretName": svc,
			"commonName": fmt.Sprintf("%s.%s.svc", svc, ns),
			"dnsNames": []interface{}{
				fmt.Sprintf("%s.%s.svc", svc, ns),
				fmt.Sprintf("%s.%s.svc.cluster.local", svc, ns),
			},
			"usages": []interface{}{"server auth", "digital signature", "key encipherment"},
			"privateKey": map[string]interface{}{
				"algorithm":      "ECDSA",
				"size":           int64(256),
				"rotationPolicy": "Always",
			},
			"secretTemplate": map[string]interface{}{"labels": labels},
			"issuerRef": map[string]interface{}{
				"group": "cert-manager.io",
				"kind":  issuer.Kind,
				"name":  issuer.Name,
			},
		},
	}}
	status["podAdditions"] = map[string]interface{}{
		"volumes": []interface{}{map[string]interface{}{
			"name": servingCertVolumeName(svc),
			"secret": map[string]interface{}{
				"secretName":  svc,
				"defaultMode": int64(0o420),
			},
		}},
		"volumeMounts": []interface{}{map[string]interface{}{
			"name":      servingCertVolumeName(svc),
			"readOnly":  true,
			"mountPath": servingCertMountPath,
		}},
	}
	state.Status = status
	return state, nil
}

var nonAlphaNum = regexp.MustCompile(`[^a-z0-9]+`)

// endpointPortName follows the operator's common.EndpointName (lower case,
// runs of other characters become "-"), cut to the 15 characters a service
// port name allows.
func endpointPortName(name string) string {
	n := strings.Trim(nonAlphaNum.ReplaceAllString(strings.ToLower(name), "-"), "-")
	if len(n) > 15 {
		n = strings.TrimRight(n[:15], "-")
	}
	return n
}

// certificateReady reports whether cert-manager has issued the certificate.
func certificateReady(cert *unstructured.Unstructured) bool {
	conds, _, _ := unstructured.NestedSlice(cert.Object, "status", "conditions")
	for _, c := range conds {
		m, ok := c.(map[string]interface{})
		if !ok {
			continue
		}
		if m["type"] == "Ready" && m["status"] == "True" {
			return true
		}
	}
	return false
}
