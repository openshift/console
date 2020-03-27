import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { getKnativeServiceData } from '../topology/knative-topology-utils';
import {
  knativeServingResourcesRevision,
  knativeServingResourcesConfigurations,
} from './create-knative-utils';

export const getRevisionItems = (revisions: K8sResourceKind[]) => {
  return revisions.reduce((acc, currValue) => {
    acc[currValue.metadata.name] = currValue.metadata.name;
    return acc;
  }, {});
};

export const constructObjForUpdate = (traffic, service) => {
  const obj = _.omit(service, 'status');
  return {
    ...obj,
    spec: { ...obj.spec, traffic },
  };
};

export const transformTrafficSplitingData = (
  obj: K8sResourceKind,
  resources,
): K8sResourceKind[] => {
  const { revisions } = getKnativeServiceData(obj, resources);
  return revisions;
};

export const knativeServingResourcesTrafficSplitting = (namespace: string): FirehoseResource[] => [
  ...knativeServingResourcesRevision(namespace),
  ...knativeServingResourcesConfigurations(namespace),
];
