import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { getKnativeServiceData } from '../topology/knative-topology-utils';
import {
  knativeServingResourcesRevision,
  knativeServingResourcesConfigurations,
} from './get-knative-resources';

export type RevisionItems = { [name: string]: string };

export const getRevisionItems = (revisions: K8sResourceKind[]): RevisionItems => {
  return revisions.reduce((acc, currValue) => {
    acc[currValue.metadata.name] = currValue.metadata.name;
    return acc;
  }, {} as RevisionItems);
};

export const constructObjForUpdate = (traffic, service) => {
  const obj = _.omit(service, 'status');
  return {
    ...obj,
    spec: { ...obj.spec, traffic },
  };
};

export const transformTrafficSplittingData = (
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
