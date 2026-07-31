/**
 * Shared test helpers for OLS update workflow tests
 */
import type { K8sResourceConditionStatus } from '@console/internal/module/k8s';
import { K8sResourceConditionStatus as ConditionStatus } from '@console/internal/module/k8s';

/**
 * Condition status constants to use instead of string literals
 */
export const STATUS = {
  TRUE: ConditionStatus.True,
  FALSE: ConditionStatus.False,
  UNKNOWN: ConditionStatus.Unknown,
} as const;

/**
 * Helper to create condition objects (ClusterVersionCondition, K8sResourceCondition, etc.)
 * without excessive type casts. Centralizes the type casts needed for test data.
 *
 * @param type - Condition type (e.g., 'Progressing', 'Failing', 'Available')
 * @param status - Condition status ('True', 'False', or 'Unknown')
 * @param reason - Reason for the condition
 * @param message - Human-readable message
 * @returns Condition object typed as any to work with all condition types in tests
 */
export function createCondition(
  type: string,
  status: 'True' | 'False' | 'Unknown',
  reason: string,
  message: string,
): any {
  return {
    type,
    status: status as K8sResourceConditionStatus,
    reason,
    message,
    lastTransitionTime: '2024-01-01T00:00:00Z',
  };
}
