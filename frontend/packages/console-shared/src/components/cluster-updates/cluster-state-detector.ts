import type { ClusterVersionKind, ClusterOperator } from '@console/internal/module/k8s';
import {
  isClusterFailing,
  isClusterProgressing,
  isClusterInvalid,
  isClusterAvailable,
  isClusterUpgradeable,
  hasRecommendedUpdates,
  hasConditionalUpdates,
  hasUpdateRetrievalFailure,
  hasReleaseAcceptanceFailure,
  hasAnyOperatorIssues,
  hasUnknownConditions,
} from './predicates';

/**
 * Comprehensive cluster state enumeration
 * Maps to the different OLS prompt scenarios
 */
export enum ClusterState {
  /** Scenario 1: Cluster ready to update with recommended updates available */
  READY_WITH_UPDATES = 'ready-with-updates',

  /** Scenario 2: Cluster ready to update with conditional updates (have concerns/risks) */
  READY_WITH_CONDITIONAL_UPDATES = 'ready-with-conditional-updates',

  /** Scenario 3: Update in progress, monitoring progress */
  UPDATE_IN_PROGRESS = 'update-in-progress',

  /** Scenario 4: Cluster failing, needs troubleshooting */
  FAILING = 'failing',

  /** Scenario 5: Update completed successfully, cluster up-to-date */
  UP_TO_DATE = 'up-to-date',

  /** Additional states for comprehensive coverage */
  NOT_UPGRADEABLE = 'not-upgradeable',
  UPDATE_SERVICE_FAILURE = 'update-service-failure',
  OPERATOR_ISSUES = 'operator-issues',
  INVALID_CONFIGURATION = 'invalid-configuration',
  UNKNOWN_STATE = 'unknown-state',
}

/**
 * Cluster state detection result with detailed context
 */
export interface ClusterStateInfo {
  /** Primary cluster state */
  state: ClusterState;

  /** Human-readable state description */
  description: string;

  /** Detailed conditions for this state */
  conditions: {
    failing: boolean;
    progressing: boolean;
    invalid: boolean;
    available: boolean;
    upgradeable: boolean;
    hasRecommendedUpdates: boolean;
    hasConditionalUpdates: boolean;
    hasUpdateServiceFailure: boolean;
    hasOperatorIssues: boolean;
    hasUnknownConditions: boolean;
  };

  /** Recommended OLS workflow phase for this state */
  recommendedWorkflow: 'status' | 'pre-check';
}

/**
 * Detect the current cluster state based on ClusterVersion and ClusterOperator conditions
 *
 * This implements the comprehensive cluster state matrix required for OLS prompt selection:
 *
 * 1. Ready to update with recommended updates:
 *    - Failing=False, Progressing=False, availableUpdates present
 *    - Prompt: Check readiness for available updates
 *
 * 2. Ready to update with conditional updates:
 *    - Failing=False, Progressing=False, conditionalUpdates with risks
 *    - Prompt: Check readiness and assess conditional update risks
 *
 * 3. Update in progress:
 *    - Failing=False, Progressing=True
 *    - Prompt: Monitor update progress (operators, alerts, etc.)
 *
 * 4. Cluster failing:
 *    - Failing=True (or operator issues, or update service failures)
 *    - Prompt: Troubleshoot failure causes
 *
 * 5. Up-to-date:
 *    - Failing=False, Progressing=False, no updates available, version matches desired
 *    - Prompt: Provide update completion summary and cluster health status
 *
 * @param cv - ClusterVersion resource
 * @param operators - Optional array of ClusterOperator resources
 * @returns Comprehensive cluster state information
 */
export const detectClusterState = (
  cv: ClusterVersionKind,
  operators?: ClusterOperator[],
): ClusterStateInfo => {
  // Gather all condition predicates
  const conditions = {
    failing: isClusterFailing(cv),
    progressing: isClusterProgressing(cv),
    invalid: isClusterInvalid(cv),
    available: isClusterAvailable(cv),
    upgradeable: isClusterUpgradeable(cv),
    hasRecommendedUpdates: hasRecommendedUpdates(cv),
    hasConditionalUpdates: hasConditionalUpdates(cv),
    hasUpdateServiceFailure: hasUpdateRetrievalFailure(cv) || hasReleaseAcceptanceFailure(cv),
    hasOperatorIssues: hasAnyOperatorIssues(operators),
    hasUnknownConditions: hasUnknownConditions(cv),
  };

  // Priority 1: Invalid configuration
  if (conditions.invalid) {
    return {
      state: ClusterState.INVALID_CONFIGURATION,
      description: 'Cluster has invalid configuration',
      conditions,
      recommendedWorkflow: 'status',
    };
  }

  // Priority 2: Operator issues
  if (conditions.hasOperatorIssues && !conditions.failing) {
    return {
      state: ClusterState.OPERATOR_ISSUES,
      description: 'Cluster operators have issues (degraded or unavailable)',
      conditions,
      recommendedWorkflow: 'status',
    };
  }

  // Priority 3: Cluster failures (Scenario 4)
  if (conditions.failing) {
    return {
      state: ClusterState.FAILING,
      description: 'Cluster has failures that need troubleshooting',
      conditions,
      recommendedWorkflow: 'status',
    };
  }

  // Priority 4: Update in progress (Scenario 3)
  if (conditions.progressing) {
    return {
      state: ClusterState.UPDATE_IN_PROGRESS,
      description: 'Cluster update is in progress',
      conditions,
      recommendedWorkflow: 'status',
    };
  }

  // Priority 5: Update service failures
  if (conditions.hasUpdateServiceFailure) {
    return {
      state: ClusterState.UPDATE_SERVICE_FAILURE,
      description: 'Cluster cannot retrieve or verify updates',
      conditions,
      recommendedWorkflow: 'status',
    };
  }

  // Priority 6: Not upgradeable
  if (!conditions.upgradeable) {
    return {
      state: ClusterState.NOT_UPGRADEABLE,
      description: 'Cluster is marked as not upgradeable',
      conditions,
      recommendedWorkflow: 'pre-check',
    };
  }

  // Priority 7: Ready with conditional updates (Scenario 2)
  if (conditions.hasConditionalUpdates && !conditions.hasRecommendedUpdates) {
    return {
      state: ClusterState.READY_WITH_CONDITIONAL_UPDATES,
      description: 'Cluster has conditional updates with risks/concerns',
      conditions,
      recommendedWorkflow: 'pre-check',
    };
  }

  // Priority 8: Ready with recommended updates (Scenario 1)
  if (conditions.hasRecommendedUpdates) {
    return {
      state: ClusterState.READY_WITH_UPDATES,
      description: 'Cluster is ready to update with available updates',
      conditions,
      recommendedWorkflow: 'pre-check',
    };
  }

  // Priority 9: Unknown conditions detected
  if (conditions.hasUnknownConditions) {
    return {
      state: ClusterState.UNKNOWN_STATE,
      description: 'Cluster has unknown condition states',
      conditions,
      recommendedWorkflow: 'status',
    };
  }

  // Default: Up-to-date (Scenario 5)
  return {
    state: ClusterState.UP_TO_DATE,
    description: 'Cluster is up-to-date with no available updates',
    conditions,
    recommendedWorkflow: 'pre-check',
  };
};

/**
 * Check if cluster is in a healthy state
 * Healthy means: not failing, not invalid, no operator issues, no unknown conditions
 *
 * @param cv - ClusterVersion resource
 * @param operators - Optional array of ClusterOperator resources
 * @returns true if cluster is healthy
 */
export const isClusterHealthy = (
  cv: ClusterVersionKind,
  operators?: ClusterOperator[],
): boolean => {
  const stateInfo = detectClusterState(cv, operators);
  return (
    !stateInfo.conditions.failing &&
    !stateInfo.conditions.invalid &&
    !stateInfo.conditions.hasOperatorIssues &&
    !stateInfo.conditions.hasUpdateServiceFailure &&
    !stateInfo.conditions.hasUnknownConditions
  );
};

/**
 * Determine if cluster should show the pre-check workflow
 * Pre-check is shown when cluster is healthy and not progressing
 *
 * @param cv - ClusterVersion resource
 * @param operators - Optional array of ClusterOperator resources
 * @returns true if pre-check workflow should be shown
 */
export const shouldShowPreCheck = (
  cv: ClusterVersionKind,
  operators?: ClusterOperator[],
): boolean => {
  const stateInfo = detectClusterState(cv, operators);
  return (
    stateInfo.recommendedWorkflow === 'pre-check' &&
    !stateInfo.conditions.progressing &&
    isClusterHealthy(cv, operators)
  );
};

/**
 * Determine if cluster should show the status workflow
 * Status is shown when cluster is progressing or has issues
 *
 * @param cv - ClusterVersion resource
 * @param operators - Optional array of ClusterOperator resources
 * @returns true if status workflow should be shown
 */
export const shouldShowStatus = (
  cv: ClusterVersionKind,
  operators?: ClusterOperator[],
): boolean => {
  const stateInfo = detectClusterState(cv, operators);
  return (
    stateInfo.recommendedWorkflow === 'status' ||
    stateInfo.conditions.progressing ||
    !isClusterHealthy(cv, operators)
  );
};
