import { FirehoseResource } from '@console/internal/components/utils';
import { K8sResourceKind, Patch } from '@console/internal/module/k8s';
import { Traffic } from '../types';
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

export const trafficDataForPatch = (traffic: Traffic[], service: K8sResourceKind): Patch[] => [
  {
    op: service.spec?.traffic ? 'replace' : 'add',
    path: '/spec/traffic',
    value: traffic,
  },
];

export const knativeServingResourcesTrafficSplitting = (namespace: string): FirehoseResource[] => [
  ...knativeServingResourcesRevision(namespace),
  ...knativeServingResourcesConfigurations(namespace),
];
