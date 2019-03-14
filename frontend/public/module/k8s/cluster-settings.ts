/* eslint-disable no-unused-vars, no-undef */
import * as _ from 'lodash-es';

import { ClusterVersionModel } from '../../models';
import { referenceForModel } from './k8s';
import { ClusterVersionKind, ClusterUpdate, ClusterVersionConditionType, K8sResourceConditionStatus, ClusterVersionCondition } from '.';

export enum ClusterUpdateStatus {
  UpToDate = 'Up to Date',
  UpdatesAvailable = 'Updates Available',
  Updating = 'Updating',
  Failing = 'Failing',
  ErrorRetrieving = 'Error Retrieving',
}

export const clusterVersionReference = referenceForModel(ClusterVersionModel);

export const getAvailableClusterUpdates = (cv: ClusterVersionKind): ClusterUpdate[] => {
  return _.get(cv, 'status.availableUpdates', []);
};

export const getAvailableClusterChannels = () => ({'nightly-4.0': 'nightly-4.0', 'pre-release-4.0': 'pre-release-4.0', 'stable-4.0': 'stable-4.0'});

export const getDesiredClusterVersion = (cv: ClusterVersionKind): string => {
  return _.get(cv, 'status.desired.version');
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
