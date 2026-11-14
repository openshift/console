package main

import (
	"crypto/tls"
	"flag"
	"net/url"

	"github.com/openshift/console/pkg/proxy"
	"github.com/openshift/console/pkg/server"
)

// monitoringHosts holds the in-cluster locations (host:port) of the Thanos and
// Alertmanager services the bridge proxies to.
type monitoringHosts struct {
	thanos                   *string
	thanosTenancy            *string
	thanosTenancyForRules    *string
	alertManager             *string
	alertManagerUserWorkload *string
	alertManagerTenancy      *string
}

const serviceCAFileNote = " Only used in in-cluster mode when --service-ca-file is set; the service must present a certificate signed by that CA."

// addMonitoringHostFlags registers the flags that locate the monitoring services.
// The defaults are the well-known OpenShift monitoring services.
func addMonitoringHostFlags(fs *flag.FlagSet) *monitoringHosts {
	return &monitoringHosts{
		thanos:                   fs.String("thanos-host", openshiftThanosHost, "Location (host:port) of the Thanos querier service for non-tenant queries."+serviceCAFileNote),
		thanosTenancy:            fs.String("thanos-tenancy-host", openshiftThanosTenancyHost, "Location (host:port) of the tenant-aware Thanos querier service for query and query_range."+serviceCAFileNote),
		thanosTenancyForRules:    fs.String("thanos-tenancy-for-rules-host", openshiftThanosTenancyForRulesHost, "Location (host:port) of the tenant-aware Thanos querier service for rules."+serviceCAFileNote),
		alertManager:             fs.String("alertmanager-host", openshiftAlertManagerHost, "Location (host:port) of the Alertmanager service for platform alerts."+serviceCAFileNote),
		alertManagerUserWorkload: fs.String("alermanager-user-workload-host", openshiftAlertManagerHost, "Location of the Alertmanager service for user-defined alerts."),
		alertManagerTenancy:      fs.String("alermanager-tenancy-host", openshiftAlertManagerTenancyHost, "Location of the tenant-aware Alertmanager service."),
	}
}

// setMonitoringProxyConfigs points the server's Thanos and Alertmanager proxies at hosts.
func setMonitoringProxyConfigs(srv *server.Server, hosts *monitoringHosts, tlsConfig *tls.Config) {
	newConfig := func(host string) *proxy.Config {
		return &proxy.Config{
			TLSClientConfig: tlsConfig,
			HeaderBlacklist: srv.ProxyHeaderDenyList,
			Endpoint:        &url.URL{Scheme: "https", Host: host, Path: "/api"},
		}
	}
	srv.ThanosProxyConfig = newConfig(*hosts.thanos)
	srv.ThanosTenancyProxyConfig = newConfig(*hosts.thanosTenancy)
	srv.ThanosTenancyProxyForRulesConfig = newConfig(*hosts.thanosTenancyForRules)
	srv.AlertManagerProxyConfig = newConfig(*hosts.alertManager)
	srv.AlertManagerUserWorkloadProxyConfig = newConfig(*hosts.alertManagerUserWorkload)
	srv.AlertManagerTenancyProxyConfig = newConfig(*hosts.alertManagerTenancy)
}
