/* eslint-disable no-undef, no-unused-vars */

import * as _ from 'lodash-es';

import { K8sResourceKind } from '../../module/k8s';

export const serviceClassDisplayName = (serviceClass: K8sResourceKind): string =>
  _.get(serviceClass, 'spec.externalMetadata.displayName') || _.get(serviceClass, 'spec.externalName');

export const planExternalName = (serviceInstance: K8sResourceKind): string =>
  _.get(serviceInstance, 'spec.clusterServicePlanExternalName') || _.get(serviceInstance, 'spec.servicePlanExternalName');

const statusCondition = (obj: K8sResourceKind, type: string) => {
  return _.find(_.get(obj, 'status.conditions'), {type: type});
};

const isStatusReady = (obj: K8sResourceKind) => {
  return _.get(statusCondition(obj, 'Ready'), 'status') === 'True';
};

export const serviceCatalogStatus = (obj: K8sResourceKind) => {
  const conditions = _.get(obj, 'status.conditions');
  const statusError = _.find(conditions, {type: 'Failed', status: 'True'});

  if (statusError) {
    return 'Failed';
  }

  if (isStatusReady(obj)) {
    return 'Ready';
  }

  return 'Pending';
};

