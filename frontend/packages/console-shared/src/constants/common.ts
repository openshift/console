/* eslint-disable @typescript-eslint/naming-convention */

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
  blurFilterInput: 'Escape',
  focusNamespaceDropdown: 'n',
});

export const RESOURCE_NAME_TRUNCATE_LENGTH = 13;

// Use a key for the "all" namespaces option that would be an invalid namespace name to avoid a potential clash
export const ALL_NAMESPACES_KEY = '#ALL_NS#';

// Use a key for the "all" applications option that would be an invalid application name to avoid a potential clash
export const ALL_APPLICATIONS_KEY = '#ALL_APPS#';
export const UNASSIGNED_APPLICATIONS_KEY = '#UNASSIGNED_APP#';

// Prefix our localStorage items to avoid conflicts if another app ever runs on the same domain.
export const STORAGE_PREFIX = 'bridge';

export const USERSETTINGS_PREFIX = 'console';

// This localStorage key predates the storage prefix.
export const NAMESPACE_USERSETTINGS_PREFIX = `${USERSETTINGS_PREFIX}.namespace`;
export const NAMESPACE_LOCAL_STORAGE_KEY = 'dropdown-storage-namespaces';
export const APPLICATION_USERSETTINGS_PREFIX = `${USERSETTINGS_PREFIX}.applications`;
export const APPLICATION_LOCAL_STORAGE_KEY = 'dropdown-storage-applications';
export const LAST_NAMESPACE_NAME_USER_SETTINGS_KEY = `${USERSETTINGS_PREFIX}.lastNamespace`;
export const LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/last-namespace-name`;
export const API_DISCOVERY_RESOURCES_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/api-discovery-resources`;
export const COMMUNITY_PROVIDERS_WARNING_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/community-providers-warning`;
export const COMMUNITY_PROVIDERS_WARNING_USERSETTINGS_KEY = `${USERSETTINGS_PREFIX}.communityProvidersWarning`;
export const PINNED_RESOURCES_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/pinned-resources`;
export const COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/table-columns`;
export const LOG_WRAP_LINES_USERSETTINGS_KEY = `${USERSETTINGS_PREFIX}.log.wrapLines`;
export const SHOW_YAML_EDITOR_TOOLTIPS_USER_SETTING_KEY = `${USERSETTINGS_PREFIX}.showYAMLEditorTooltips`;
export const SHOW_YAML_EDITOR_TOOLTIPS_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/showYAMLEditorTooltips`;
export const SHOW_FULL_LOG_USERSETTINGS_KEY = `${USERSETTINGS_PREFIX}.show.full.log`;
// Bootstrap user for OpenShift 4.0 clusters (kube:admin)
export const KUBE_ADMIN_USERNAMES = ['kube:admin'];

export const RH_OPERATOR_SUPPORT_POLICY_LINK =
  'https://access.redhat.com/third-party-software-support';

// Package manifests for the OperatorHub use this label.
export const OPERATOR_HUB_LABEL = 'openshift-marketplace';

export enum FLAGS {
  AUTH_ENABLED = 'AUTH_ENABLED',
  PROMETHEUS = 'PROMETHEUS',
  OPENSHIFT = 'OPENSHIFT',
  MONITORING = 'MONITORING',
  CAN_CREATE_NS = 'CAN_CREATE_NS',
  CAN_GET_NS = 'CAN_GET_NS',
  CAN_LIST_NS = 'CAN_LIST_NS',
  CAN_LIST_NODE = 'CAN_LIST_NODE',
  CAN_LIST_PV = 'CAN_LIST_PV',
  CAN_LIST_CRD = 'CAN_LIST_CRD',
  CAN_LIST_USERS = 'CAN_LIST_USERS',
  CAN_LIST_GROUPS = 'CAN_LIST_GROUPS',
  CAN_LIST_OPERATOR_GROUP = 'CAN_LIST_OPERATOR_GROUP',
  CAN_LIST_PACKAGE_MANIFEST = 'CAN_LIST_PACKAGE_MANIFEST',
  CAN_CREATE_PROJECT = 'CAN_CREATE_PROJECT',
  CAN_LIST_VSC = 'CAN_LIST_VSC',
  CLUSTER_AUTOSCALER = 'CLUSTER_AUTOSCALER',
  SHOW_OPENSHIFT_START_GUIDE = 'SHOW_OPENSHIFT_START_GUIDE',
  CLUSTER_API = 'CLUSTER_API',
  CLUSTER_VERSION = 'CLUSTER_VERSION',
  MACHINE_CONFIG = 'MACHINE_CONFIG',
  MACHINE_AUTOSCALER = 'MACHINE_AUTOSCALER',
  MACHINE_HEALTH_CHECK = 'MACHINE_HEALTH_CHECK',
  CONSOLE_LINK = 'CONSOLE_LINK',
  CONSOLE_CLI_DOWNLOAD = 'CONSOLE_CLI_DOWNLOAD',
  CONSOLE_NOTIFICATION = 'CONSOLE_NOTIFICATION',
  CONSOLE_EXTERNAL_LOG_LINK = 'CONSOLE_EXTERNAL_LOG_LINK',
  CONSOLE_YAML_SAMPLE = 'CONSOLE_YAML_SAMPLE',
  CONSOLE_QUICKSTART = 'CONSOLE_QUICKSTART',
  CONSOLE_CAPABILITY_LIGHTSPEEDBUTTON_IS_ENABLED = 'CONSOLE_CAPABILITY_LIGHTSPEEDBUTTON_IS_ENABLED',
  CONSOLE_CAPABILITY_GETTINGSTARTEDBANNER_IS_ENABLED = 'CONSOLE_CAPABILITY_GETTINGSTARTEDBANNER_IS_ENABLED',
  LIGHTSPEED_IS_AVAILABLE_TO_INSTALL = 'LIGHTSPEED_IS_AVAILABLE_TO_INSTALL',
}

export const CONFIG_STORAGE_CONSOLE = 'console';
export const COLUMN_MANAGEMENT_CONFIGMAP_KEY = `${CONFIG_STORAGE_CONSOLE}.tableColumns`;
export const ACM_LINK_ID = 'acm-console-link';

export const SYSTEM_NAMESPACES_PREFIX = ['kube-', 'openshift-', 'kubernetes-'];
export const SYSTEM_NAMESPACES = ['default', 'openshift'];

export enum REQUESTER_FILTER {
  ME = 'me',
  USER = 'user',
  SYSTEM = 'system',
}

export enum USER_TELEMETRY_ANALYTICS {
  ALLOW = 'allow',
  DENY = 'deny',
}

export enum CLUSTER_TELEMETRY_ANALYTICS {
  OPTIN = 'OPT-IN',
  OPTOUT = 'OPT-OUT',
  DISABLED = 'DISABLED',
  ENFORCE = 'ENFORCE',
}

export const CLUSTER_VERSION_DEFAULT_UPSTREAM_SERVER_URL_PLACEHOLDER =
  'https://api.openshift.com/api/upgrades_info/v1/graph';

export const GETTING_STARTED_USER_SETTINGS_KEY_CLUSTER_DASHBOARD =
  'console.clusterDashboard.gettingStarted.expanded';
export const PREFERRED_TELEMETRY_USER_SETTING_KEY = 'telemetry.analytics';
