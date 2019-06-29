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

// Common shortcuts than span pages.
export const KEYBOARD_SHORTCUTS = Object.freeze({
  focusFilterInput: '/',
  focusNamespaceDropdown: 'n',
});

// Use a key for the "all" namespaces option that would be an invalid namespace name to avoid a potential clash
export const ALL_NAMESPACES_KEY = '#ALL_NS#';

// Use a key for the "all" applications option that would be an invalid application name to avoid a potential clash
export const ALL_APPLICATIONS_KEY = '#ALL_APPS#';

// Prefix our localStorage items to avoid conflicts if another app ever runs on the same domain.
export const STORAGE_PREFIX = 'bridge';

// This localStorage key predates the storage prefix.
export const NAMESPACE_LOCAL_STORAGE_KEY = 'dropdown-storage-namespaces';
export const APPLICATION_LOCAL_STORAGE_KEY = 'dropdown-storage-applications';
export const LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-namespace-name`;
export const LAST_PERSPECTIVE_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-perspective`;
export const API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/api-discovery-resources`;
export const COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/community-providers-warning`;

// Bootstrap user for OpenShift 4.0 clusters
export const KUBE_ADMIN_USERNAME = 'kube:admin';

export const RH_OPERATOR_SUPPORT_POLICY_LINK = 'https://access.redhat.com/third-party-software-support';

// Package manifests for the OperatorHub use this label.
export const OPERATOR_HUB_LABEL = 'openshift-marketplace';

export const OC_DOWNLOAD_LINK = 'https://mirror.openshift.com/pub/openshift-v4/clients/oc/4.1';
export const ODO_DOWNLOAD_LINK = 'https://mirror.openshift.com/pub/openshift-v4/clients/odo/latest';

export enum FLAGS {
  AUTH_ENABLED = 'AUTH_ENABLED',
  PROMETHEUS = 'PROMETHEUS',
  OPERATOR_LIFECYCLE_MANAGER = 'OPERATOR_LIFECYCLE_MANAGER',
  CHARGEBACK = 'CHARGEBACK',
  OPENSHIFT = 'OPENSHIFT',
  CAN_GET_NS = 'CAN_GET_NS',
  CAN_LIST_NS = 'CAN_LIST_NS',
  CAN_LIST_NODE = 'CAN_LIST_NODE',
  CAN_LIST_PV = 'CAN_LIST_PV',
  CAN_LIST_STORE = 'CAN_LIST_STORE',
  CAN_LIST_CRD = 'CAN_LIST_CRD',
  CAN_LIST_PACKAGE_MANIFEST = 'CAN_LIST_PACKAGE_MANIFEST',
  CAN_LIST_OPERATOR_GROUP = 'CAN_LIST_OPERATOR_GROUP',
  CAN_CREATE_PROJECT = 'CAN_CREATE_PROJECT',
  SHOW_OPENSHIFT_START_GUIDE = 'SHOW_OPENSHIFT_START_GUIDE',
  SERVICE_CATALOG = 'SERVICE_CATALOG',
  OPERATOR_HUB = 'OPERATOR_HUB',
  CLUSTER_API = 'CLUSTER_API',
  CLUSTER_VERSION = 'CLUSTER_VERSION',
  MACHINE_CONFIG = 'MACHINE_CONFIG',
  MACHINE_AUTOSCALER = 'MACHINE_AUTOSCALER',
  CONSOLE_CLI_DOWNLOAD = 'CONSOLE_CLI_DOWNLOAD',
  CONSOLE_NOTIFICATION = 'CONSOLE_NOTIFICATION',
}
