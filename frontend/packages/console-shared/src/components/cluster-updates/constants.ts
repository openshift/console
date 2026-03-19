/**
 * Constants for cluster update workflows
 */

/**
 * ClusterVersion condition types
 * See: https://docs.openshift.com/container-platform/latest/rest_api/config_apis/clusterversion-config-openshift-io-v1.html
 */
export const CLUSTER_VERSION_CONDITION_AVAILABLE = 'Available';
export const CLUSTER_VERSION_CONDITION_FAILING = 'Failing';
export const CLUSTER_VERSION_CONDITION_PROGRESSING = 'Progressing';
export const CLUSTER_VERSION_CONDITION_RETRIEVED_UPDATES = 'RetrievedUpdates';
export const CLUSTER_VERSION_CONDITION_RELEASE_ACCEPTED = 'ReleaseAccepted';
export const CLUSTER_VERSION_CONDITION_INVALID = 'Invalid';
export const CLUSTER_VERSION_CONDITION_UPGRADEABLE = 'Upgradeable';

/**
 * ClusterOperator condition types
 */
export const CLUSTER_OPERATOR_CONDITION_AVAILABLE = 'Available';
export const CLUSTER_OPERATOR_CONDITION_DEGRADED = 'Degraded';
export const CLUSTER_OPERATOR_CONDITION_PROGRESSING = 'Progressing';
export const CLUSTER_OPERATOR_CONDITION_UPGRADEABLE = 'Upgradeable';

/**
 * K8s resource condition status values
 */
export const CONDITION_STATUS_TRUE = 'True';
export const CONDITION_STATUS_FALSE = 'False';
export const CONDITION_STATUS_UNKNOWN = 'Unknown';

/**
 * Feature flags for cluster update workflows
 */
export const FEATURE_FLAG_LIGHTSPEED_PLUGIN = 'LIGHTSPEED_PLUGIN';

/**
 * OpenShift Lightspeed extension identifiers
 * See: https://github.com/openshift/lightspeed-console/tree/main#example
 */
export const OLS_EXTENSION_TYPE = 'console.action/provider';
export const OLS_EXTENSION_CONTEXT_ID = 'ols-open-handler';

/**
 * OLS integration behavior options
 */
export const OLS_SUBMIT_IMMEDIATELY = true;
export const OLS_HIDE_PROMPT = true;
export const OLS_NO_ATTACHMENTS: never[] = [];
