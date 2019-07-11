import * as _ from 'lodash-es';

import { ClusterVersionModel } from '../../models';
import { referenceForModel } from './k8s';
import { ClusterVersionKind, ClusterUpdate, ClusterVersionConditionType, K8sResourceConditionStatus, ClusterVersionCondition, UpdateHistory } from '.';

export enum ClusterUpdateStatus {
  UpToDate = 'Up to Date',
  UpdatesAvailable = 'Updates Available',
  Updating = 'Updating',
  Failing = 'Failing',
  ErrorRetrieving = 'Error Retrieving',
  Invalid = 'Invalid Cluster Version',
}

export const clusterVersionReference = referenceForModel(ClusterVersionModel);

export const getAvailableClusterUpdates = (cv: ClusterVersionKind): ClusterUpdate[] => {
  return _.get(cv, 'status.availableUpdates', []);
};

export const getAvailableClusterChannels = () => ({'nightly-4.1': 'nightly-4.1', 'prerelease-4.1': 'prerelease-4.1', 'stable-4.1': 'stable-4.1'});

export const getDesiredClusterVersion = (cv: ClusterVersionKind): string => {
  return _.get(cv, 'status.desired.version');
};

export const getLastCompletedUpdate = (cv: ClusterVersionKind): string => {
  const history: UpdateHistory[] = _.get(cv, 'status.history', []);
  const lastCompleted: UpdateHistory = history.find(update => update.state === 'Completed');
  return lastCompleted && lastCompleted.version;
};

export const getClusterVersionCondition = (cv: ClusterVersionKind, type: ClusterVersionConditionType, status: K8sResourceConditionStatus = undefined): ClusterVersionCondition => {
  const conditions: ClusterVersionCondition[] = _.get(cv, 'status.conditions');
  if (status) {
    return _.find(conditions, {type, status});
  }
  return _.find(conditions, {type});
};

export const isProgressing = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(getClusterVersionCondition(cv, ClusterVersionConditionType.Progressing, K8sResourceConditionStatus.True));
};

export const invalid = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(getClusterVersionCondition(cv, ClusterVersionConditionType.Invalid, K8sResourceConditionStatus.True));
};

export const failedToRetrieveUpdates = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(getClusterVersionCondition(cv, ClusterVersionConditionType.RetrievedUpdates, K8sResourceConditionStatus.False));
};

export const updateFailing = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(getClusterVersionCondition(cv, ClusterVersionConditionType.Failing, K8sResourceConditionStatus.True));
};

export const hasAvailableUpdates = (cv: ClusterVersionKind): boolean => {
  return !_.isEmpty(getAvailableClusterUpdates(cv));
};

export const getClusterUpdateStatus = (cv: ClusterVersionKind): ClusterUpdateStatus => {
  if (invalid(cv)) {
    return ClusterUpdateStatus.Invalid;
  }

  if (updateFailing(cv)) {
    return ClusterUpdateStatus.Failing;
  }

  if (failedToRetrieveUpdates(cv)) {
    return ClusterUpdateStatus.ErrorRetrieving;
  }

  if (isProgressing(cv)) {
    return ClusterUpdateStatus.Updating;
  }

  return hasAvailableUpdates(cv) ? ClusterUpdateStatus.UpdatesAvailable : ClusterUpdateStatus.UpToDate;
};

export const getK8sGitVersion = (k8sVersionResponse): string => _.get(k8sVersionResponse, 'gitVersion');

export const getOpenShiftVersion = (cv: ClusterVersionKind): string => {
  const lastUpdate: UpdateHistory = _.get(cv, 'status.history[0]');
  if (!lastUpdate) {
    return null;
  }
  return lastUpdate.state === 'Partial' ? `Updating to ${lastUpdate.version}` : lastUpdate.version;
};

export const getClusterName = (): string => window.SERVER_FLAGS.kubeAPIServerURL || null;
