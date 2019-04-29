export const CONST = Object.freeze({
  // http://kubernetes.io/docs/user-guide/images/#bypassing-kubectl-create-secrets
  PULL_SECRET_TYPE: 'kubernetes.io/dockerconfigjson',
  PULL_SECRET_DATA: '.dockerconfigjson',
});

export const ANNOTATIONS = Object.freeze({
  displayName: 'openshift.io/display-name',
  providerDisplayName: 'openshift.io/provider-display-name',
  documentationURL: 'openshift.io/documentation-url',
  supportURL: 'openshift.io/support-url',
});

// Use a key for the "all" namespaces option that would be an invalid namespace name to avoid a potential clash
export const ALL_NAMESPACES_KEY = '#ALL_NS#';

// Prefix our localStorage items to avoid conflicts if another app ever runs on the same domain.
export const STORAGE_PREFIX = 'bridge';

// This localStorage key predates the storage prefix.
export const NAMESPACE_LOCAL_STORAGE_KEY = 'dropdown-storage-namespaces';
export const LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-namespace-name`;
export const API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/api-discovery-resources`;
export const COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/community-providers-warning`;
export const SWAGGER_SESSION_STORAGE_KEY = `${STORAGE_PREFIX}/${window.SERVER_FLAGS.consoleVersion}/swagger-definitions`;

// Bootstrap user for OpenShift 4.0 clusters
export const KUBE_ADMIN_USERNAME = 'kube:admin';

export const OPERATOR_HUB_CSC_BASE = 'installed';
export const RH_OPERATOR_SUPPORT_POLICY_LINK = 'https://access.redhat.com/third-party-software-support';

// Package manifests for the OperatorHub use this label.
export const OPERATOR_HUB_LABEL = 'openshift-marketplace';

export const OC_DOWNLOAD_LINK = 'https://mirror.openshift.com/pub/openshift-v4/clients/oc/4.1';
export const ODO_DOWNLOAD_LINK = 'https://mirror.openshift.com/pub/openshift-v4/clients/odo/latest';
