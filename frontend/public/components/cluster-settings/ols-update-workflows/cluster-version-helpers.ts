import { safeDump } from 'js-yaml';
import type { ClusterVersionKind, ClusterOperator } from '../../../module/k8s';

// OLS attachment type - specific to cluster update workflows
// Must match the Attachment type expected by lightspeed-console plugin
interface OLSAttachment {
  attachmentType: string;
  kind: string;
  name: string;
  namespace: string;
  value: string;
  ownerName?: string;
  originalValue?: string;
  isEditable?: boolean;
}

/**
 * Creates a YAML attachment for OLS with cluster update data
 */
const createYAMLAttachment = (
  name: string,
  data:
    | ClusterVersionKind
    | ClusterOperator
    | { apiVersion: string; kind: string; items: ClusterOperator[] },
): OLSAttachment => {
  let yamlValue: string;
  try {
    yamlValue = safeDump(data, { indent: 2, lineWidth: -1 });
  } catch (error) {
    // Fallback to JSON if YAML serialization fails
    yamlValue = `# YAML serialization failed, showing JSON instead\n${JSON.stringify(
      data,
      null,
      2,
    )}`;
  }

  return {
    attachmentType: 'YAML',
    kind: data?.kind || 'Resource',
    name,
    namespace: '', // ClusterVersion and ClusterOperator are cluster-scoped (no namespace)
    value: yamlValue,
    ownerName: '', // Not applicable for cluster update resources
  };
};

/**
 * Individual helper functions for cluster version operations
 * These avoid factory patterns which can cause re-render issues in React
 */

/**
 * Extract current version from cluster version history
 */
export const getCurrentVersion = (cv: ClusterVersionKind): string =>
  cv.status?.history?.find((h) => h.state === 'Completed')?.version ?? '';

/**
 * Extract desired version from cluster version spec or status
 */
export const getDesiredVersion = (cv: ClusterVersionKind): string =>
  (cv.spec?.desiredUpdate?.version || cv.status?.desired?.version) ?? '';

/**
 * Create attachment with full ClusterVersion YAML for OLS analysis
 * This approach lets OLS analyze the complete data and find relevant patterns
 */
export const createClusterVersionAttachment = (cv: ClusterVersionKind): OLSAttachment =>
  createYAMLAttachment(
    `clusterversion-${cv.metadata?.name || 'version'}`,
    cv, // Send the complete ClusterVersion object
  );

/**
 * Create attachment with ClusterOperator data for OLS analysis
 * This provides operator-level details for comprehensive analysis
 */
export const createClusterOperatorsAttachment = (
  clusterOperators?: ClusterOperator[],
): OLSAttachment | null => {
  if (!clusterOperators || clusterOperators.length === 0) {
    return null;
  }

  return createYAMLAttachment('clusteroperators', {
    apiVersion: 'v1',
    kind: 'List',
    items: clusterOperators,
  });
};

/**
 * Create all attachments for OLS analysis
 * Returns both ClusterVersion and ClusterOperator data
 */
export const createUpdateAttachments = (
  cv: ClusterVersionKind,
  clusterOperators?: ClusterOperator[],
): OLSAttachment[] => {
  const attachments = [createClusterVersionAttachment(cv)];

  const operatorsAttachment = createClusterOperatorsAttachment(clusterOperators);
  if (operatorsAttachment) {
    attachments.push(operatorsAttachment);
  }

  return attachments;
};
