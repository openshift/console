package config

import "time"

const (
	K8sInClusterCA          = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"
	K8sInClusterBearerToken = "/var/run/secrets/kubernetes.io/serviceaccount/token"

	CatalogdHost = "catalogd-service.openshift-catalogd.svc:443"

	DefaultCacheDuration = 5 * time.Minute
	DefaultCacheCleanup  = 30 * time.Minute

	// Well-known location of the tenant aware Thanos service for OpenShift exposing the query and query_range endpoints. This is only accessible in-cluster.
	// Thanos proxies requests to both cluster monitoring and user workload monitoring prometheus instances.
	OpenshiftThanosTenancyHost = "thanos-querier.openshift-monitoring.svc:9092"

	// Well-known location of the tenant aware Thanos service for OpenShift exposing the rules endpoint. This is only accessible in-cluster.
	// Thanos proxies requests to the cluster monitoring and user workload monitoring prometheus instances as well as Thanos ruler instances.
	OpenshiftThanosTenancyForRulesHost = "thanos-querier.openshift-monitoring.svc:9093"

	// Well-known location of the Thanos service for OpenShift. This is only accessible in-cluster.
	// This is used for non-tenant global query requests
	// proxying to both cluster monitoring and user workload monitoring prometheus instances.
	OpenshiftThanosHost = "thanos-querier.openshift-monitoring.svc:9091"

	// Well-known location of Alert Manager service for OpenShift. This is only accessible in-cluster.
	OpenshiftAlertManagerHost = "alertmanager-main.openshift-monitoring.svc:9094"

	// Default location of the tenant aware Alert Manager service for OpenShift. This is only accessible in-cluster.
	OpenshiftAlertManagerTenancyHost = "alertmanager-main.openshift-monitoring.svc:9092"

	// Well-known location of the GitOps service. This is only accessible in-cluster
	OpenshiftGitOpsHost = "cluster.openshift-gitops.svc:8080"

	// Well-known location of the cluster proxy service. This is only accessible in-cluster
	OpenshiftClusterProxyHost = "cluster-proxy-addon-user.multicluster-engine.svc:9092"

	ClusterManagementURL = "https://api.openshift.com/"
)
