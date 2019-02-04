
export const CONST = {
  title: 'Bridge',
  dateFmt: 'MM-dd-yyyy',
  timeFmt: 'HH:mm:ss a Z',
  placeholderText: '-',
  INVALID_POLICY: 'Unknown Configuration',

  // http://kubernetes.io/docs/user-guide/images/#bypassing-kubectl-create-secrets
  PULL_SECRET_TYPE: 'kubernetes.io/dockerconfigjson',
  PULL_SECRET_DATA: '.dockerconfigjson',
};

export const EVENTS = {
  CONTAINER_REMOVE: 'container-remove',
};

// Use a key for the "all" namespaces option that would be an invalid namespace name to avoid a potential clash
export const ALL_NAMESPACES_KEY = '#ALL_NS#';

// Prefix our localStorage items to avoid conflicts if another app ever runs on the same domain.
const STORAGE_PREFIX = 'bridge';

// This localStorage key predates the storage prefix.
export const NAMESPACE_LOCAL_STORAGE_KEY = 'dropdown-storage-namespaces';
export const LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-namespace-name`;
export const API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/api-discovery-resources`;
export const COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/community-providers-warning`;

// Bootstrap user for OpenShift 4.0 clusters
export const KUBE_ADMIN_USERNAME = 'kube:admin';

export const OPERATOR_HUB_CSC_BASE = 'installed';
export const RH_OPERATOR_SUPPORT_POLICY_LINK = 'https://access.redhat.com/third-party-software-support';

// Package manifests for the Operator Hub use this label.
export const OPERATOR_HUB_LABEL = 'openshift-marketplace';
