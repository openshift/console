import type { TFunction } from 'i18next';
import type { ClusterVersionKind, ClusterOperator } from '../../../module/k8s';
import type { UpdateWorkflowPhase, UpdateWorkflowContext, OLSAttachment } from './types';
import { getDesiredClusterVersion } from '../../../module/k8s';
import { createPreCheckSpecificVersionPrompt } from './prompts';
import { getUpdateWorkflowConfig } from './workflow-configs';

/**
 * Utility functions for cluster update workflows
 */

/**
 * Generate OLS prompt for a specific update workflow phase
 */
export const generateUpdatePrompt = (
  phase: UpdateWorkflowPhase,
  cv: ClusterVersionKind,
  t: TFunction,
  clusterOperators?: ClusterOperator[],
  targetVersion?: string,
): string => {
  // For pre-check phase with target version, use specific version prompt
  if (phase === 'pre-check' && targetVersion) {
    const currentVersion = getDesiredClusterVersion(cv);
    return createPreCheckSpecificVersionPrompt(currentVersion, targetVersion);
  }

  // Otherwise use the default workflow configuration
  const context: UpdateWorkflowContext = { phase, cv, clusterOperators, t, data: cv };
  const config = getUpdateWorkflowConfig(phase);
  return config.prompt(context);
};

/**
 * Create OLS attachments for a specific update workflow phase
 */
export const createUpdateAttachments = (
  phase: UpdateWorkflowPhase,
  cv: ClusterVersionKind,
  t: TFunction,
  clusterOperators?: ClusterOperator[],
): OLSAttachment[] => {
  const context: UpdateWorkflowContext = { phase, cv, clusterOperators, t, data: cv };
  const config = getUpdateWorkflowConfig(phase);
  return config.attachments(context);
};

/**
 * Get button text for a specific update workflow phase
 */
export const getUpdateButtonText = (phase: UpdateWorkflowPhase, t: TFunction): string => {
  const config = getUpdateWorkflowConfig(phase);
  return config.buttonText(t);
};

/**
 * Get button translation key for a specific update workflow phase
 * Extracts the translation key from workflow configurations for use with OLSButton
 */
export const getUpdateButtonTranslationKey = (phase: UpdateWorkflowPhase): string => {
  // Translation keys that match the keys used in workflow-configs.ts buttonText functions
  const keys: Record<UpdateWorkflowPhase, string> = {
    status: 'public~Update status',
    'pre-check': 'public~Pre-check with AI',
  };
  return keys[phase];
};

/**
 * Check if cluster has available updates
 */
export const hasAvailableUpdates = (cv: ClusterVersionKind): boolean =>
  (cv.status?.availableUpdates?.length || 0) > 0;

/**
 * Check if there are any degraded or unavailable cluster operators
 */
export const hasOperatorIssues = (clusterOperators?: ClusterOperator[]): boolean => {
  if (!clusterOperators || clusterOperators.length === 0) {
    return false;
  }

  return clusterOperators.some((operator) => {
    const conditions = operator.status?.conditions || [];

    // Check if operator is degraded
    const degraded = conditions.find((c) => c.type === 'Degraded' && c.status === 'True');

    // Check if operator is not available
    const available = conditions.find((c) => c.type === 'Available' && c.status === 'False');

    return degraded || available;
  });
};

/**
 * Determine the appropriate workflow phase based on cluster version status and operator conditions
 */
export const determineWorkflowPhase = (
  cv: ClusterVersionKind,
  clusterOperators?: ClusterOperator[],
): UpdateWorkflowPhase => {
  const conditions = cv.status?.conditions || [];

  // Check for failure conditions or progressing condition - both show status button
  // The status workflow will automatically use troubleshoot prompt for failures
  const failing = conditions.find((c) => c.type === 'Failing' && c.status === 'True');
  const invalid = conditions.find((c) => c.type === 'Invalid' && c.status === 'True');
  const retrievedUpdates = conditions.find(
    (c) => c.type === 'RetrievedUpdates' && c.status === 'False',
  );
  const releaseAccepted = conditions.find(
    (c) => c.type === 'ReleaseAccepted' && c.status === 'False',
  );
  const progressing = conditions.find((c) => c.type === 'Progressing' && c.status === 'True');

  // Check for operator-level issues
  const operatorIssues = hasOperatorIssues(clusterOperators);

  // Show status button for any of these conditions:
  // - Cluster is failing (will auto-switch to troubleshoot prompt)
  // - Cluster is progressing (will use progress prompt)
  // - There are operator issues (will auto-switch to troubleshoot prompt)
  if (
    failing ||
    invalid ||
    (retrievedUpdates && retrievedUpdates.message) ||
    (releaseAccepted && releaseAccepted.message) ||
    operatorIssues ||
    progressing
  ) {
    return 'status';
  }

  // If cluster is healthy (not failing, not progressing), show pre-check
  return 'pre-check';
};

/**
 * Determine which workflow buttons to show based on cluster state and operator conditions
 */
export const determineWorkflowButtons = (
  cv: ClusterVersionKind,
  clusterOperators?: ClusterOperator[],
): {
  showStatus: boolean;
  showPreCheck: boolean;
} => {
  const phase = determineWorkflowPhase(cv, clusterOperators);

  // Show status button when cluster is failing or progressing
  // The status workflow will automatically switch between progress and troubleshoot prompts
  if (phase === 'status') {
    return { showStatus: true, showPreCheck: false };
  }

  // Show pre-check button when cluster is healthy (not failing, not progressing)
  if (phase === 'pre-check') {
    return { showStatus: false, showPreCheck: true };
  }

  // Default behavior: No buttons shown
  return { showStatus: false, showPreCheck: false };
};
