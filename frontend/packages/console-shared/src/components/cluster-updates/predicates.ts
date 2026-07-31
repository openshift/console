import type { ClusterVersionKind, ClusterOperator } from '@console/internal/module/k8s';
import {
  CLUSTER_VERSION_CONDITION_AVAILABLE,
  CLUSTER_VERSION_CONDITION_FAILING,
  CLUSTER_VERSION_CONDITION_INVALID,
  CLUSTER_VERSION_CONDITION_PROGRESSING,
  CLUSTER_VERSION_CONDITION_RETRIEVED_UPDATES,
  CLUSTER_VERSION_CONDITION_RELEASE_ACCEPTED,
  CLUSTER_VERSION_CONDITION_UPGRADEABLE,
  CLUSTER_OPERATOR_CONDITION_DEGRADED,
  CLUSTER_OPERATOR_CONDITION_AVAILABLE,
  CLUSTER_OPERATOR_CONDITION_UPGRADEABLE,
  CONDITION_STATUS_TRUE,
  CONDITION_STATUS_FALSE,
  CONDITION_STATUS_UNKNOWN,
} from './constants';

/**
 * Testable condition checking predicates for cluster updates
 * These pure functions encapsulate condition logic for better testability and reuse
 */

/**
 * Check if cluster is currently failing
 * @param cv - ClusterVersion resource
 * @returns true if Failing condition status is True
 */
export const isClusterFailing = (cv: ClusterVersionKind): boolean => {
  const conditions = cv?.status?.conditions || [];
  return conditions.some(
    (c) => c.type === CLUSTER_VERSION_CONDITION_FAILING && c.status === CONDITION_STATUS_TRUE,
  );
};

/**
 * Check if cluster configuration is invalid
 * @param cv - ClusterVersion resource
 * @returns true if Invalid condition status is True
 */
export const isClusterInvalid = (cv: ClusterVersionKind): boolean => {
  const conditions = cv?.status?.conditions || [];
  return conditions.some(
    (c) => c.type === CLUSTER_VERSION_CONDITION_INVALID && c.status === CONDITION_STATUS_TRUE,
  );
};

/**
 * Check if cluster is currently progressing through an update
 * @param cv - ClusterVersion resource
 * @returns true if Progressing condition status is True
 */
export const isClusterProgressing = (cv: ClusterVersionKind): boolean => {
  const conditions = cv?.status?.conditions || [];
  return conditions.some(
    (c) => c.type === CLUSTER_VERSION_CONDITION_PROGRESSING && c.status === CONDITION_STATUS_TRUE,
  );
};

/**
 * Check if cluster failed to retrieve updates
 * @param cv - ClusterVersion resource
 * @returns true if RetrievedUpdates condition status is False
 */
export const hasUpdateRetrievalFailure = (cv: ClusterVersionKind): boolean => {
  const conditions = cv?.status?.conditions || [];
  return conditions.some(
    (c) =>
      c.type === CLUSTER_VERSION_CONDITION_RETRIEVED_UPDATES && c.status === CONDITION_STATUS_FALSE,
  );
};

/**
 * Check if release was not accepted (signature verification failed)
 * @param cv - ClusterVersion resource
 * @returns true if ReleaseAccepted condition status is False
 */
export const hasReleaseAcceptanceFailure = (cv: ClusterVersionKind): boolean => {
  const conditions = cv?.status?.conditions || [];
  return conditions.some(
    (c) =>
      c.type === CLUSTER_VERSION_CONDITION_RELEASE_ACCEPTED && c.status === CONDITION_STATUS_FALSE,
  );
};

/**
 * Check if cluster has recommended updates available
 * @param cv - ClusterVersion resource
 * @returns true if availableUpdates array has entries
 */
export const hasRecommendedUpdates = (cv: ClusterVersionKind): boolean => {
  return (cv.status?.availableUpdates?.length || 0) > 0;
};

/**
 * Check if cluster has conditional updates (with risks/warnings)
 * @param cv - ClusterVersion resource
 * @returns true if conditionalUpdates array has entries
 */
export const hasConditionalUpdates = (cv: ClusterVersionKind): boolean => {
  return (cv.status?.conditionalUpdates?.length || 0) > 0;
};

/**
 * Check if a specific operator is degraded
 * @param operator - ClusterOperator resource
 * @returns true if operator has Degraded=True condition
 * @public
 */
export const isOperatorDegraded = (operator: ClusterOperator): boolean => {
  const conditions = operator?.status?.conditions || [];
  return conditions.some(
    (c) => c.type === CLUSTER_OPERATOR_CONDITION_DEGRADED && c.status === CONDITION_STATUS_TRUE,
  );
};

/**
 * Check if a specific operator is unavailable
 * @param operator - ClusterOperator resource
 * @returns true if operator has Available=False condition
 * @public
 */
export const isOperatorUnavailable = (operator: ClusterOperator): boolean => {
  const conditions = operator?.status?.conditions || [];
  return conditions.some(
    (c) => c.type === CLUSTER_OPERATOR_CONDITION_AVAILABLE && c.status === CONDITION_STATUS_FALSE,
  );
};

/**
 * Check if a specific operator has issues (degraded or unavailable)
 * @param operator - ClusterOperator resource
 * @returns true if operator is degraded or unavailable
 */
export const hasOperatorIssues = (operator: ClusterOperator): boolean => {
  return isOperatorDegraded(operator) || isOperatorUnavailable(operator);
};

/**
 * Check if any operators in the cluster have issues
 * @param operators - Array of ClusterOperator resources
 * @returns true if any operator is degraded or unavailable
 */
export const hasAnyOperatorIssues = (operators?: ClusterOperator[]): boolean => {
  if (!operators || operators.length === 0) {
    return false;
  }
  return operators.some(hasOperatorIssues);
};

/**
 * Get all operators with issues
 * @param operators - Array of ClusterOperator resources
 * @returns Array of operators that are degraded or unavailable
 * @public
 */
export const getOperatorsWithIssues = (operators?: ClusterOperator[]): ClusterOperator[] => {
  if (!operators || operators.length === 0) {
    return [];
  }
  return operators.filter(hasOperatorIssues);
};

/**
 * Check if cluster has any blocking conditions preventing updates
 * @param cv - ClusterVersion resource
 * @param operators - Optional array of ClusterOperator resources
 * @returns true if cluster has failures, invalid config, or operator issues
 * @public
 */
export const hasBlockingConditions = (
  cv: ClusterVersionKind,
  operators?: ClusterOperator[],
): boolean => {
  return (
    isClusterFailing(cv) ||
    isClusterInvalid(cv) ||
    hasUpdateRetrievalFailure(cv) ||
    hasReleaseAcceptanceFailure(cv) ||
    hasAnyOperatorIssues(operators)
  );
};

/**
 * Check if cluster is available
 * @param cv - ClusterVersion resource
 * @returns true if Available condition status is True
 */
export const isClusterAvailable = (cv: ClusterVersionKind): boolean => {
  const conditions = cv?.status?.conditions || [];
  return conditions.some(
    (c) => c.type === CLUSTER_VERSION_CONDITION_AVAILABLE && c.status === CONDITION_STATUS_TRUE,
  );
};

/**
 * Check if cluster is upgradeable
 * @param cv - ClusterVersion resource
 * @returns true if Upgradeable condition status is True
 */
export const isClusterUpgradeable = (cv: ClusterVersionKind): boolean => {
  const conditions = cv?.status?.conditions || [];
  const upgradeableCondition = conditions.find(
    (c) => c.type === CLUSTER_VERSION_CONDITION_UPGRADEABLE,
  );
  // If Upgradeable condition is not present, assume cluster is upgradeable (default behavior)
  // If present and status is False, cluster is not upgradeable
  return upgradeableCondition ? upgradeableCondition.status === CONDITION_STATUS_TRUE : true;
};

/**
 * Check if cluster has any updates available (recommended or conditional)
 * @param cv - ClusterVersion resource
 * @returns true if either availableUpdates or conditionalUpdates are present
 * @public
 */
export const hasAnyUpdates = (cv: ClusterVersionKind): boolean => {
  return hasRecommendedUpdates(cv) || hasConditionalUpdates(cv);
};

/**
 * Check if cluster is ready to update
 * Cluster is ready when: not failing, not progressing, and upgradeable
 * @param cv - ClusterVersion resource
 * @param operators - Optional array of ClusterOperator resources
 * @returns true if cluster is ready to start an update
 * @public
 */
export const isClusterReadyToUpdate = (
  cv: ClusterVersionKind,
  operators?: ClusterOperator[],
): boolean => {
  return (
    !isClusterFailing(cv) &&
    !isClusterProgressing(cv) &&
    !isClusterInvalid(cv) &&
    isClusterUpgradeable(cv) &&
    !hasAnyOperatorIssues(operators)
  );
};

/**
 * Check if an operator is upgradeable
 * @param operator - ClusterOperator resource
 * @returns true if operator has Upgradeable=True condition (or condition not present)
 * @public
 */
export const isOperatorUpgradeable = (operator: ClusterOperator): boolean => {
  const conditions = operator?.status?.conditions || [];
  const upgradeableCondition = conditions.find(
    (c) => c.type === CLUSTER_OPERATOR_CONDITION_UPGRADEABLE,
  );
  // If Upgradeable condition is not present, assume operator is upgradeable
  return upgradeableCondition ? upgradeableCondition.status === CONDITION_STATUS_TRUE : true;
};

/**
 * Check if all conditions have Unknown status
 * This can indicate a cluster monitoring or communication issue
 * @param cv - ClusterVersion resource
 * @returns true if any condition has Unknown status
 */
export const hasUnknownConditions = (cv: ClusterVersionKind): boolean => {
  const conditions = cv?.status?.conditions || [];
  return conditions.some((c) => c.status === CONDITION_STATUS_UNKNOWN);
};
