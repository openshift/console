import type { TFunction } from 'i18next';
import type { ClusterVersionKind, ClusterOperator } from '../../../module/k8s';

/**
 * Cluster Update specific OLS workflow types
 */

// OLS attachment type - specific to cluster update workflows
// Must match the Attachment type expected by lightspeed-console plugin
export interface OLSAttachment {
  attachmentType: string;
  kind: string;
  name: string;
  namespace: string;
  value: string;
  ownerName?: string;
  originalValue?: string;
  isEditable?: boolean;
}

// OLS workflow context - specific to cluster update workflows
export interface OLSWorkflowContext<T = ClusterVersionKind> {
  t: TFunction;
  data: T;
  [key: string]: unknown;
}

/**
 * Update workflow phases for OLS integration
 *
 * The workflow has 2 primary phases:
 * - 'status': Provides real-time update progress monitoring. Automatically adapts
 *   its prompt based on cluster state (troubleshooting for failures, progress
 *   monitoring for in-progress updates).
 * - 'pre-check': Pre-update validation and readiness assessment before initiating
 *   an update. Helps users understand prerequisites and requirements.
 *
 * Note: While the 'status' phase dynamically handles multiple scenarios (failure
 * analysis, progress tracking, success validation), it is still a single phase
 * from a type system perspective.
 */
export type UpdateWorkflowPhase = 'status' | 'pre-check';

export interface UpdateWorkflowContext extends OLSWorkflowContext<ClusterVersionKind> {
  phase: UpdateWorkflowPhase;
  cv: ClusterVersionKind;
  clusterOperators?: ClusterOperator[];
}

export interface UpdateWorkflowConfig {
  prompt: (context: UpdateWorkflowContext) => string;
  attachments: (context: UpdateWorkflowContext) => OLSAttachment[];
  buttonText: (t: TFunction) => string;
}
