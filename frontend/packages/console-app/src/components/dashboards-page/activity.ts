import { ClusterVersionKind } from '@console/internal/module/k8s/types';
import {
  ClusterUpdateStatus,
  getClusterUpdateStatus,
} from '@console/internal/module/k8s/cluster-settings';

export const isClusterUpdateActivity = (cv: ClusterVersionKind) =>
  getClusterUpdateStatus(cv) === ClusterUpdateStatus.Updating;

export const getClusterUpdateTimestamp = (cv: ClusterVersionKind) =>
  cv && cv.status && cv.status.history[0] ? new Date(cv.status.history[0].startedTime) : null;
