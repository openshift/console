import type { TFunction } from 'i18next';
import type { Alert } from '@console/dynamic-plugin-sdk';
import type {
  ClusterVersionKind,
  ClusterOperator,
  MachineConfigPoolKind,
} from '@console/internal/module/k8s';

/**
 * Cluster Update specific OLS workflow types
 */

/**
 * Machine Config Pool resource type
 * Re-export of MachineConfigPoolKind from internal module for consistency
 */
export type MachineConfigPool = MachineConfigPoolKind;

// OLS workflow context - specific to cluster update workflows
interface OLSWorkflowContext<T = ClusterVersionKind> {
  t: TFunction;
  data: T;
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
  machineConfigPools?: MachineConfigPool[];
  alerts?: Alert[];
}

export interface UpdateWorkflowConfig {
  prompt: (context: UpdateWorkflowContext) => string;
  buttonText: (t: TFunction) => string;
}
