package main

import (
	"crypto/tls"
	"flag"
	"testing"

	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/server"
)

func monitoringEndpoints(t *testing.T, args []string) map[string]string {
	t.Helper()
	fs := flag.NewFlagSet("bridge", flag.ContinueOnError)
	hosts := addMonitoringHostFlags(fs)
	if err := fs.Parse(args); err != nil {
		t.Fatalf("parse flags: %v", err)
	}
	tlsConfig := &tls.Config{}
	srv := &server.Server{ProxyHeaderDenyList: []string{"Cookie"}}
	setMonitoringProxyConfigs(srv, hosts, tlsConfig)

	configs := map[string]*proxy.Config{
		"thanos":                   srv.ThanosProxyConfig,
		"thanosTenancy":            srv.ThanosTenancyProxyConfig,
		"thanosTenancyForRules":    srv.ThanosTenancyProxyForRulesConfig,
		"alertManager":             srv.AlertManagerProxyConfig,
		"alertManagerUserWorkload": srv.AlertManagerUserWorkloadProxyConfig,
		"alertManagerTenancy":      srv.AlertManagerTenancyProxyConfig,
	}
	endpoints := map[string]string{}
	for name, c := range configs {
		if c.TLSClientConfig != tlsConfig {
			t.Errorf("%s: TLS config is not the service CA config", name)
		}
		if len(c.HeaderBlacklist) != 1 || c.HeaderBlacklist[0] != "Cookie" {
			t.Errorf("%s: header deny list = %v", name, c.HeaderBlacklist)
		}
		endpoints[name] = c.Endpoint.String()
	}
	return endpoints
}

func assertEndpoints(t *testing.T, got, want map[string]string) {
	t.Helper()
	for name, w := range want {
		if got[name] != w {
			t.Errorf("%s endpoint = %q, want %q", name, got[name], w)
		}
	}
}

func TestMonitoringProxyDefaultsUnchanged(t *testing.T) {
	assertEndpoints(t, monitoringEndpoints(t, nil), map[string]string{
		"thanos":                   "https://thanos-querier.openshift-monitoring.svc:9091/api",
		"thanosTenancy":            "https://thanos-querier.openshift-monitoring.svc:9092/api",
		"thanosTenancyForRules":    "https://thanos-querier.openshift-monitoring.svc:9093/api",
		"alertManager":             "https://alertmanager-main.openshift-monitoring.svc:9094/api",
		"alertManagerUserWorkload": "https://alertmanager-main.openshift-monitoring.svc:9094/api",
		"alertManagerTenancy":      "https://alertmanager-main.openshift-monitoring.svc:9092/api",
	})
}

func TestMonitoringProxyHostFlags(t *testing.T) {
	got := monitoringEndpoints(t, []string{
		"--thanos-host=vm.monitoring.svc:8443",
		"--thanos-tenancy-host=vm-tenancy.monitoring.svc:9092",
		"--thanos-tenancy-for-rules-host=vm-rules.monitoring.svc:9093",
		"--alertmanager-host=vmalertmanager.monitoring.svc:9443",
	})
	assertEndpoints(t, got, map[string]string{
		"thanos":                "https://vm.monitoring.svc:8443/api",
		"thanosTenancy":         "https://vm-tenancy.monitoring.svc:9092/api",
		"thanosTenancyForRules": "https://vm-rules.monitoring.svc:9093/api",
		"alertManager":          "https://vmalertmanager.monitoring.svc:9443/api",
		// The upstream alermanager-* flags are independent of --alertmanager-host.
		"alertManagerUserWorkload": "https://alertmanager-main.openshift-monitoring.svc:9094/api",
		"alertManagerTenancy":      "https://alertmanager-main.openshift-monitoring.svc:9092/api",
	})
}
