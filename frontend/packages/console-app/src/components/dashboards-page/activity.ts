import * as _ from 'lodash';
import {
  ClusterVersionKind,
  ClusterUpdateStatus,
  getClusterUpdateStatus,
  getClusterOperatorStatus,
  OperatorStatus,
  ClusterOperator,
} from '@console/internal/module/k8s';

export const isClusterUpdateActivity = (cv: ClusterVersionKind) =>
  getClusterUpdateStatus(cv) === ClusterUpdateStatus.Updating;

export const getClusterUpdateTimestamp = (cv: ClusterVersionKind) =>
  cv && cv.status && cv.status.history[0] ? new Date(cv.status.history[0].startedTime) : null;

export const isClusterOperatorUpgradeActivity = (resource: ClusterOperator) =>
  getClusterOperatorStatus(resource) === OperatorStatus.Updating;

export const getClusterOperatorUpgradeTimestamp = (resource: ClusterOperator) => {
  const conditions = _.get(resource, 'status.conditions');
  const progressing: any = _.find(conditions, { type: 'Progressing', status: 'True' });
  return progressing ? new Date(progressing.lastTransitionTime) : null;
};
