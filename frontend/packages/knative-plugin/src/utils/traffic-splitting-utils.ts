import * as _ from 'lodash';
import { FirehoseResource } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  knativeServingResourcesRevision,
  knativeServingResourcesConfigurations,
} from './get-knative-resources';

export type RevisionItems = { [name: string]: string };

export const getRevisionItems = (revisions: K8sResourceKind[]): RevisionItems => {
  if (!revisions) return {} as RevisionItems;

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

export const knativeServingResourcesTrafficSplitting = (namespace: string): FirehoseResource[] => [
  ...knativeServingResourcesRevision(namespace),
  ...knativeServingResourcesConfigurations(namespace),
];
