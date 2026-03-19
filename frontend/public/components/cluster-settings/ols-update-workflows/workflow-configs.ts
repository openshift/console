import type { UpdateWorkflowPhase, UpdateWorkflowConfig, UpdateWorkflowContext } from './types';
import type { ClusterOperator } from '../../../module/k8s';
import {
  getCurrentVersion,
  getDesiredVersion,
  createUpdateAttachments,
} from './cluster-version-helpers';
import {
  createTroubleshootPrompt,
  createProgressPrompt,
  createPreCheckPrompt,
  createPreCheckSpecificVersionPrompt,
  createPreCheckNoUpdatesPrompt,
} from './prompts';

/**
 * Update workflow configurations for different phases
 */

const createStatusWorkflow = (): UpdateWorkflowConfig => ({
  buttonText: (t) => t('public~Update status'),

  prompt: ({ cv, clusterOperators }: UpdateWorkflowContext) => {
    const currentVersion = getCurrentVersion(cv);
    const desiredVersion = getDesiredVersion(cv);

    // Check if there are failure conditions that should trigger troubleshoot prompt
    const conditions = cv.status?.conditions || [];

    // Check for failure conditions
    const failing = conditions.find((c) => c.type === 'Failing' && c.status === 'True');
    const invalid = conditions.find((c) => c.type === 'Invalid' && c.status === 'True');
    const retrievedUpdates = conditions.find(
      (c) => c.type === 'RetrievedUpdates' && c.status === 'False',
    );
    const releaseAccepted = conditions.find(
      (c) => c.type === 'ReleaseAccepted' && c.status === 'False',
    );

    // Check for operator issues
    const hasOperatorIssues = clusterOperators?.some((operator) => {
      const operatorConditions = operator.status?.conditions || [];
      const degraded = operatorConditions.find((c) => c.type === 'Degraded' && c.status === 'True');
      const available = operatorConditions.find(
        (c) => c.type === 'Available' && c.status === 'False',
      );
      return degraded || available;
    });

    // If there are failures, use troubleshoot prompt instead of progress prompt
    const hasFailures =
      failing ||
      invalid ||
      (retrievedUpdates && retrievedUpdates.message) ||
      (releaseAccepted && releaseAccepted.message) ||
      hasOperatorIssues;

    if (hasFailures) {
      return createTroubleshootPrompt(currentVersion, desiredVersion);
    }

    // Helper function to extract operator version
    const getOperatorVersion = (operator: ClusterOperator): string | null => {
      const versions = operator.status?.versions || [];
      // Find the "operator" version entry first
      const operatorVersion = versions.find((v) => v.name === 'operator');
      if (operatorVersion?.version) {
        return operatorVersion.version;
      }
      // Fallback: find the highest version among all entries
      const sortedVersions = versions
        .filter((v) => v.version)
        .sort((a, b) => (b.version || '').localeCompare(a.version || ''));
      return sortedVersions[0]?.version || null;
    };

    // Calculate operator status counts
    const total = clusterOperators?.length || 0;

    // Failed operators: Available=False OR Degraded=True
    const failed =
      clusterOperators?.filter((operator) => {
        const operatorConditions = operator.status?.conditions || [];
        const degraded = operatorConditions.find(
          (c) => c.type === 'Degraded' && c.status === 'True',
        );
        const available = operatorConditions.find(
          (c) => c.type === 'Available' && c.status === 'False',
        );
        return degraded || available;
      }).length || 0;

    // Updated operators: Current version equals target version
    const updated =
      clusterOperators?.filter((operator) => {
        const operatorVersion = getOperatorVersion(operator);
        return operatorVersion === desiredVersion;
      }).length || 0;

    // Updating operators: Current version < target AND Progressing=True
    const updating =
      clusterOperators?.filter((operator) => {
        const operatorVersion = getOperatorVersion(operator);
        const operatorConditions = operator.status?.conditions || [];
        const progressing = operatorConditions.find(
          (c) => c.type === 'Progressing' && c.status === 'True',
        );
        return operatorVersion && operatorVersion !== desiredVersion && progressing;
      }).length || 0;

    // Pending operators: Current version < target AND Progressing=False
    const pending =
      clusterOperators?.filter((operator) => {
        const operatorVersion = getOperatorVersion(operator);
        const operatorConditions = operator.status?.conditions || [];
        const progressing = operatorConditions.find(
          (c) => c.type === 'Progressing' && c.status === 'True',
        );
        return operatorVersion && operatorVersion !== desiredVersion && !progressing;
      }).length || 0;

    const operatorCounts = { total, updated, updating, pending, failed };

    // Otherwise use normal progress prompt
    return createProgressPrompt(currentVersion, desiredVersion, operatorCounts);
  },

  attachments: ({ cv, clusterOperators }: UpdateWorkflowContext) =>
    createUpdateAttachments(cv, clusterOperators),
});

const createPreCheckWorkflow = (): UpdateWorkflowConfig => ({
  buttonText: (t) => t('public~Pre-check with AI'),

  prompt: ({ cv }: UpdateWorkflowContext) => {
    const currentVersion = getCurrentVersion(cv);
    const hasAvailableUpdates = (cv.status?.availableUpdates?.length || 0) > 0;

    // Check if a specific version is selected for update
    const desiredVersion = cv.status?.desired?.version;
    const currentDesiredVersion = cv.status?.history?.[0]?.version;
    const hasSpecificVersionSelected = desiredVersion && desiredVersion !== currentDesiredVersion;

    if (!hasAvailableUpdates) {
      // No updates available
      return createPreCheckNoUpdatesPrompt(currentVersion);
    } else if (hasSpecificVersionSelected) {
      // Specific version selected for update
      return createPreCheckSpecificVersionPrompt(currentVersion, desiredVersion);
    }
    // Updates available but no specific version selected
    return createPreCheckPrompt(currentVersion);
  },

  attachments: ({ cv, clusterOperators }: UpdateWorkflowContext) =>
    createUpdateAttachments(cv, clusterOperators),
});

/**
 * Registry of update workflow configurations
 */
export const updateWorkflowConfigs: Record<UpdateWorkflowPhase, UpdateWorkflowConfig> = {
  status: createStatusWorkflow(),
  'pre-check': createPreCheckWorkflow(),
};

/**
 * Get workflow configuration for a specific phase
 */
export const getUpdateWorkflowConfig = (phase: UpdateWorkflowPhase): UpdateWorkflowConfig =>
  updateWorkflowConfigs[phase];
