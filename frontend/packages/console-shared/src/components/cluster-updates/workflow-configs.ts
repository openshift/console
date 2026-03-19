import type { ClusterOperator } from '@console/internal/module/k8s';
import { semVerComparator } from '@console/shared/src/utils/comparators';
import { getCurrentVersion, getDesiredVersion } from './cluster-version-helpers';
import { CLUSTER_OPERATOR_CONDITION_PROGRESSING, CONDITION_STATUS_TRUE } from './constants';
import {
  isClusterFailing,
  isClusterInvalid,
  hasUpdateRetrievalFailure,
  hasReleaseAcceptanceFailure,
  hasAnyOperatorIssues,
  hasOperatorIssues,
} from './predicates';
import { createPreCheckPrompt } from './prompts/precheck';
import { createPreCheckNoUpdatesPrompt } from './prompts/precheck-no-updates';
import { createPreCheckSpecificVersionPrompt } from './prompts/precheck-specific';
import { createProgressPrompt } from './prompts/progress';
import { createTroubleshootPrompt } from './prompts/troubleshoot';
import type { UpdateWorkflowPhase, UpdateWorkflowConfig, UpdateWorkflowContext } from './types';

/**
 * Update workflow configurations for different phases
 *
 * The status workflow intelligently chooses between progress monitoring and troubleshooting:
 * - Uses createProgressPrompt when upgrade is progressing without failures
 * - Uses createTroubleshootPrompt when failures are detected (cluster-level or operator-level)
 *
 * Decision Logic:
 * - Cluster-level failures: Failing=True, Invalid=True, RetrievedUpdates=False, ReleaseAccepted=False
 * - Operator-level failures: Any operator with Available=False OR Degraded=True
 * - Priority: Failures take precedence over progress (troubleshoot even if Progressing=True)
 *
 * See __tests__/cluster-state-matrix.spec.ts for complete state matrix and test coverage.
 */

const createStatusWorkflow = (): UpdateWorkflowConfig => ({
  buttonText: (t) => t('public~Update status'),

  prompt: ({ cv, clusterOperators }: UpdateWorkflowContext) => {
    const currentVersion = getCurrentVersion(cv);
    const desiredVersion = getDesiredVersion(cv);

    // Check if there are failure conditions that should trigger troubleshoot prompt
    // IMPORTANT: Always check the status field, not just the condition type!
    // Example: {type: "Failing", status: "False"} means NOT failing (healthy)
    const failing = isClusterFailing(cv);
    const invalid = isClusterInvalid(cv);
    const retrievedUpdates = hasUpdateRetrievalFailure(cv);
    const releaseAccepted = hasReleaseAcceptanceFailure(cv);

    // Operator-level failure detection
    // Check for operators that are unavailable (Available=False) or degraded (Degraded=True)
    const operatorIssues = hasAnyOperatorIssues(clusterOperators);

    // Determine if troubleshooting is needed
    // Failures take precedence: even if Progressing=True, we troubleshoot if failures detected
    const hasFailures = failing || invalid || retrievedUpdates || releaseAccepted || operatorIssues;

    if (hasFailures) {
      // Use troubleshoot prompt for any failure scenario:
      // - Upgrade failing (Progressing=True + failures)
      // - Cluster failing (Failing=True, not progressing)
      // - Operator issues (degraded/unavailable operators)
      // - Update service issues (cannot retrieve updates or verify releases)
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
      // Fallback: find the highest version among all entries using semantic version comparison
      const sortedVersions = versions
        .filter((v) => v.version)
        .sort((a, b) => semVerComparator(b.version || '', a.version || '')); // Descending order (highest first)
      return sortedVersions[0]?.version || null;
    };

    // Calculate operator status counts
    const total = clusterOperators?.length || 0;

    // Failed operators: Available=False OR Degraded=True
    const failed = clusterOperators?.filter(hasOperatorIssues).length || 0;

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
          (c) =>
            c.type === CLUSTER_OPERATOR_CONDITION_PROGRESSING && c.status === CONDITION_STATUS_TRUE,
        );
        return operatorVersion && operatorVersion !== desiredVersion && progressing;
      }).length || 0;

    // Pending operators: Current version < target AND Progressing=False
    const pending =
      clusterOperators?.filter((operator) => {
        const operatorVersion = getOperatorVersion(operator);
        const operatorConditions = operator.status?.conditions || [];
        const progressing = operatorConditions.find(
          (c) =>
            c.type === CLUSTER_OPERATOR_CONDITION_PROGRESSING && c.status === CONDITION_STATUS_TRUE,
        );
        return operatorVersion && operatorVersion !== desiredVersion && !progressing;
      }).length || 0;

    const operatorCounts = { total, updated, updating, pending, failed };

    // Otherwise use normal progress prompt
    return createProgressPrompt(currentVersion, desiredVersion, operatorCounts);
  },
});

/**
 * Pre-check workflow intelligently chooses the appropriate readiness assessment:
 * - createPreCheckNoUpdatesPrompt: When no updates available (cluster fully updated)
 * - createPreCheckSpecificVersionPrompt: When user has selected a specific target version
 * - createPreCheckPrompt: General readiness check when updates are available
 *
 * The pre-check workflow is shown ONLY when cluster is healthy:
 * - Failing=False (cluster not failing)
 * - Progressing=False (no upgrade in progress)
 * - No operator issues (all operators Available=True, Degraded=False)
 * - No service issues (RetrievedUpdates working, ReleaseAccepted working)
 */
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
      // No updates available - perform health assessment
      // Verifies cluster is up-to-date and operationally healthy
      return createPreCheckNoUpdatesPrompt(currentVersion);
    }
    if (hasSpecificVersionSelected) {
      // Specific version selected - assess readiness for that version
      // Validates version is available and checks version-specific compatibility
      return createPreCheckSpecificVersionPrompt(currentVersion, desiredVersion);
    }
    // Updates available - general readiness assessment
    // Lists available updates and checks for any upgrade blockers
    return createPreCheckPrompt(currentVersion);
  },
});

/**
 * Registry of update workflow configurations
 * @public
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
