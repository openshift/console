const UPSTREAM_LATEST = 'https://docs.okd.io/latest/';

// Prefer the documentation base URL passed as a flag, but fall back to the latest upstream docs if none was specified.
export const openshiftHelpBase = window.SERVER_FLAGS.documentationBaseURL || UPSTREAM_LATEST;

export const DOC_URL_OPENSHIFT_WHATS_NEW = 'https://www.openshift.com/learn/whats-new';
export const DOC_URL_OPERATORFRAMEWORK_SDK = 'https://sdk.operatorframework.io/';
export const DOC_URL_PODDISRUPTIONBUDGET_POLICY = `${UPSTREAM_LATEST}rest_api/policy_apis/poddisruptionbudget-policy-v1.html#poddisruptionbudget-policy-v1`;
export const DOC_URL_PODMAN = 'https://podman.io/';
export const DOC_URL_RED_HAT_MARKETPLACE =
  'https://marketplace.redhat.com/en-us?utm_source=openshift_console';

const KUBE_DOCS = 'https://kubernetes.io/docs/';
export const DOC_URL_STORAGE_CLASSES_AWS_EBS = `${KUBE_DOCS}/concepts/storage/storage-classes/#aws-ebs`;
export const DOC_URL_STORAGE_CLASSES_AZURE_DISK = `${KUBE_DOCS}/concepts/storage/storage-classes/#azure-disk`;
export const DOC_URL_STORAGE_CLASSES_AZURE_FILE = `${KUBE_DOCS}/concepts/storage/storage-classes/#azure-file`;
export const DOC_URL_STORAGE_CLASSES_GCE = `${KUBE_DOCS}/concepts/storage/storage-classes/#gce`;
export const DOC_URL_STORAGE_CLASSES_GLUSTERFS = `${KUBE_DOCS}/concepts/storage/storage-classes/#glusterfs`;
export const DOC_URL_STORAGE_CLASSES_LOCAL = `${KUBE_DOCS}/concepts/storage/storage-classes/#local`;
export const DOC_URL_STORAGE_CLASSES_OPENSTACK_CINDER = `${KUBE_DOCS}/concepts/storage/storage-classes/#openstack-cinder`;
export const DOC_URL_STORAGE_CLASSES_PORTWORX_VOLUME = `${KUBE_DOCS}/concepts/storage/storage-classes/#portworx-volume`;
export const DOC_URL_STORAGE_CLASSES_QUOBYTE = `${KUBE_DOCS}/concepts/storage/storage-classes/#quobyte`;
export const DOC_URL_STORAGE_CLASSES_SCALEIO = `${KUBE_DOCS}/concepts/storage/storage-classes/#scaleio`;
export const DOC_URL_STORAGE_CLASSES_STORAGEOS = `${KUBE_DOCS}/concepts/storage/storage-classes/#storageos`;
export const DOC_URL_STORAGE_CLASSES_VSPHERE = `${KUBE_DOCS}/concepts/storage/storage-classes/#vsphere`;

export const documentationURLs: documentationURLsType = {
  applicationHealth: {
    downstream: 'html/building_applications/application-health',
    upstream: 'applications/application-health.html',
  },
  configuringMonitoring: {
    downstream:
      'html/monitoring/configuring-the-monitoring-stack#maintenance-and-support_configuring-the-monitoring-stack',
    upstream:
      'monitoring/configuring-the-monitoring-stack.html#maintenance-and-support_configuring-monitoring',
  },
  networkPolicy: {
    downstream: 'html/networking/network-policy#about-network-policy',
    kube: `${KUBE_DOCS}/concepts/services-networking/network-policies/`,
    upstream: 'networking/network_policy/about-network-policy.html',
  },
  operators: {
    downstream: 'html/operators/understanding-operators#olm-what-operators-are',
    upstream: 'operators/understanding/olm-what-operators-are.html',
  },
  postInstallationMachineConfigurationTasks: {
    downstream: 'html/post-installation_configuration/index',
    upstream: 'post_installation_configuration/machine-configuration-tasks.html',
  },
  understandingUpgradeChannels: {
    downstream:
      'html/updating_clusters/understanding-upgrade-channels-releases#understanding-upgrade-channels_understanding-upgrade-channels-releases',
    upstream:
      'updating/understanding-upgrade-channels-release.html#understanding-upgrade-channels_understanding-upgrade-channels-releases',
  },
  updateService: {
    downstream:
      'html/updating_clusters/updating-restricted-network-cluster#update-service-overview_updating-restricted-network-cluster',
    upstream: 'updating/understanding-openshift-updates.html',
  },
  updateUsingCustomMachineConfigPools: {
    downstream: 'html/updating_clusters/update-using-custom-machine-config-pools.html',
    upstream: 'updating/update-using-custom-machine-config-pools.html',
  },
  usingInsights: {
    downstream:
      'html/support/remote-health-monitoring-with-connected-clusters#using-insights-to-identify-issues-with-your-cluster',
    upstream:
      'support/remote_health_monitoring/using-insights-to-identify-issues-with-your-cluster.html',
  },
  usingRBAC: {
    downstream: 'html/authentication_and_authorization/using-rbac',
    upstream: 'authentication/using-rbac.html',
  },
  workingWithProjects: {
    downstream: 'html/building_applications/projects#working-with-projects',
    upstream: 'applications/projects/working-with-projects.html',
  },
};

export const isUpstream = () => window.SERVER_FLAGS.branding === 'okd';

export const getDocumentationURL = (docURLs: docURLs) =>
  isUpstream()
    ? `${UPSTREAM_LATEST}${docURLs.upstream}`
    : `${window.SERVER_FLAGS.documentationBaseURL}${docURLs.downstream}`;

export const getNetworkPolicyDocURL = (openshiftFlag: boolean) => {
  const networkLink = getDocumentationURL(documentationURLs.networkPolicy);

  return openshiftFlag ? networkLink : documentationURLs.networkPolicy.kube;
};

type documentationURLsType = {
  [key: string]: docURLs;
};

type docURLs = {
  downstream: string;
  kube?: string;
  upstream: string;
};
