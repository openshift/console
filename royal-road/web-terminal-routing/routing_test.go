package main

import (
	"encoding/json"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// A DevWorkspaceRouting as the DevWorkspace Operator writes it for a console
// web terminal (web-terminal-exec exposes port 4444; tooling exposes nothing).
const terminalRouting = `{
  "apiVersion": "controller.devfile.io/v1alpha1",
  "kind": "DevWorkspaceRouting",
  "metadata": {"name": "routing-workspace0123", "namespace": "openshift-terminal", "uid": "u-1"},
  "spec": {
    "devworkspaceId": "workspace0123",
    "routingClass": "web-terminal-k8s",
    "podSelector": {"controller.devfile.io/devworkspace_id": "workspace0123"},
    "endpoints": {
      "web-terminal-exec": [
        {"name": "exec", "targetPort": 4444, "exposure": "public", "attributes": {"type": "main"}}
      ],
      "web-terminal-tooling": [
        {"name": "debug", "targetPort": 5005, "exposure": "none"}
      ]
    }
  }
}`

func parse(t *testing.T, s string) *unstructured.Unstructured {
	t.Helper()
	u := &unstructured.Unstructured{}
	if err := json.Unmarshal([]byte(s), &u.Object); err != nil {
		t.Fatal(err)
	}
	return u
}

func TestDesiredWebTerminal(t *testing.T) {
	state, err := desired(parse(t, terminalRouting), Issuer{Name: "web-terminal-ca", Kind: "ClusterIssuer"})
	if err != nil {
		t.Fatal(err)
	}

	// The bridge only proxies to an https ideUrl, which the operator takes
	// from the endpoint with attribute type=main.
	eps, _, _ := unstructured.NestedSlice(state.Status, "exposedEndpoints", "web-terminal-exec")
	if len(eps) != 1 {
		t.Fatalf("exposed endpoints = %v", state.Status["exposedEndpoints"])
	}
	ep := eps[0].(map[string]interface{})
	if want := "https://workspace0123-service.openshift-terminal.svc:4444"; ep["url"] != want {
		t.Errorf("url = %v, want %s", ep["url"], want)
	}
	if typ, _, _ := unstructured.NestedString(ep, "attributes", "type"); typ != "main" {
		t.Errorf("attributes.type = %q, want main", typ)
	}
	if _, ok := state.Status["exposedEndpoints"].(map[string]interface{})["web-terminal-tooling"]; ok {
		t.Error("an endpoint with exposure none was exposed")
	}

	ports, _, _ := unstructured.NestedSlice(state.Service.Object, "spec", "ports")
	if len(ports) != 1 || ports[0].(map[string]interface{})["port"] != int64(4444) {
		t.Errorf("service ports = %v", ports)
	}
	sel, _, _ := unstructured.NestedStringMap(state.Service.Object, "spec", "selector")
	if sel["controller.devfile.io/devworkspace_id"] != "workspace0123" {
		t.Errorf("service selector = %v", sel)
	}

	// The certificate must name the service as the bridge dials it, and
	// its Secret must be what the pod mounts.
	dns, _, _ := unstructured.NestedStringSlice(state.Certificate.Object, "spec", "dnsNames")
	if len(dns) == 0 || dns[0] != "workspace0123-service.openshift-terminal.svc" {
		t.Errorf("dnsNames = %v", dns)
	}
	secret, _, _ := unstructured.NestedString(state.Certificate.Object, "spec", "secretName")
	vols, _, _ := unstructured.NestedSlice(state.Status, "podAdditions", "volumes")
	mounts, _, _ := unstructured.NestedSlice(state.Status, "podAdditions", "volumeMounts")
	if len(vols) != 1 || len(mounts) != 1 {
		t.Fatalf("podAdditions = %v", state.Status["podAdditions"])
	}
	if got, _, _ := unstructured.NestedString(vols[0].(map[string]interface{}), "secret", "secretName"); got != secret {
		t.Errorf("volume secret %q, certificate secret %q", got, secret)
	}
	if got := mounts[0].(map[string]interface{})["mountPath"]; got != "/var/serving-cert/" {
		t.Errorf("mountPath = %v", got)
	}
	if kind, _, _ := unstructured.NestedString(state.Certificate.Object, "spec", "issuerRef", "kind"); kind != "ClusterIssuer" {
		t.Errorf("issuer kind = %q", kind)
	}

	for _, obj := range []*unstructured.Unstructured{state.Service, state.Certificate} {
		refs := obj.GetOwnerReferences()
		if len(refs) != 1 || refs[0].Kind != "DevWorkspaceRouting" || refs[0].UID != "u-1" {
			t.Errorf("%s owner references = %v", obj.GetKind(), refs)
		}
		// The operator's webhook only lets its own controller create objects
		// that carry the restricted-access annotation.
		if _, ok := obj.GetAnnotations()["controller.devfile.io/restricted-access"]; ok {
			t.Errorf("%s carries the restricted-access annotation", obj.GetKind())
		}
	}
}

func TestDesiredNoExposedEndpoints(t *testing.T) {
	dwr := parse(t, terminalRouting)
	_ = unstructured.SetNestedField(dwr.Object, map[string]interface{}{}, "spec", "endpoints")
	state, err := desired(dwr, Issuer{Name: "x", Kind: "ClusterIssuer"})
	if err != nil {
		t.Fatal(err)
	}
	if state.Service != nil || state.Certificate != nil {
		t.Error("objects created for a workspace without endpoints")
	}
	if state.Status["phase"] != "Ready" {
		t.Errorf("phase = %v", state.Status["phase"])
	}
}

func TestDesiredRejectsMissingSelector(t *testing.T) {
	dwr := parse(t, terminalRouting)
	unstructured.RemoveNestedField(dwr.Object, "spec", "podSelector")
	if _, err := desired(dwr, Issuer{Name: "x", Kind: "ClusterIssuer"}); err == nil {
		t.Error("no error for a routing without podSelector; its Service would select every pod")
	}
}

func TestEndpointPortName(t *testing.T) {
	for in, want := range map[string]string{
		"exec":                    "exec",
		"Web_Terminal.Exec":       "web-terminal-ex",
		"a-very-long-endpoint-nm": "a-very-long-end",
		"abcdefghijklmn-x":        "abcdefghijklmn",
	} {
		if got := endpointPortName(in); got != want {
			t.Errorf("endpointPortName(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestStatusEqualIgnoresNumberTypes(t *testing.T) {
	a := map[string]interface{}{"podAdditions": map[string]interface{}{"n": int64(420)}}
	b := map[string]interface{}{"podAdditions": map[string]interface{}{"n": float64(420)}}
	if !statusEqual(a, b) {
		t.Error("int64 and float64 420 compare unequal; status would be rewritten on every reconcile")
	}
}
