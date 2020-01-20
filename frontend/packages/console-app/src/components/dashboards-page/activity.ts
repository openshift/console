import {
  ClusterVersionKind,
  ClusterUpdateStatus,
  getClusterUpdateStatus,
} from '@console/internal/module/k8s';

export const isClusterUpgradeActivity = (cv: ClusterVersionKind) =>
  getClusterUpdateStatus(cv) === ClusterUpdateStatus.Updating;

export const getClusterUpgradeTimestamp = (cv: ClusterVersionKind) =>
  cv && cv.status && cv.status.history[0] ? new Date(cv.status.history[0].startedTime) : null;
