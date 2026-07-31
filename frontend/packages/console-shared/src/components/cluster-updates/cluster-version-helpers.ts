import type { ClusterVersionKind } from '@console/internal/module/k8s';

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
