import { k8sCreate, K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import {
  ServiceModel,
  RevisionModel,
  ConfigurationModel,
  RouteModel,
} from '@console/knative-plugin';

interface ServerlessScaling {
  minpods: number;
  maxpods: number | '';
  concurrencytarget: number | '';
  concurrencylimit: number | '';
}

export const createKnativeService = (
  name: string,
  namespace: string,
  scaling: ServerlessScaling,
  imageStreamName: string,
  imageStreamTag?: string,
  cpuResource: string = '100m',
  memoryResource: string = '100Mi',
): Promise<K8sResourceKind> => {
  const knativeDeployResource: K8sResourceKind = {
    kind: 'Service',
    apiVersion: 'serving.knative.dev/v1alpha1',
    metadata: {
      name,
      namespace,
    },
    spec: {
      template: {
        metadata: {
          annotations: {
            ...(scaling.concurrencytarget && {
              'autoscaling.knative.dev/target': `${scaling.concurrencytarget}`,
            }),
            ...(scaling.minpods && { 'autoscaling.knative.dev/minScale': `${scaling.minpods}` }),
            ...(scaling.maxpods && { 'autoscaling.knative.dev/maxScale': `${scaling.maxpods}` }),
          },
        },
        spec: {
          ...(scaling.concurrencylimit && { containerConcurrency: scaling.concurrencylimit }),
          container: {
            image: `${imageStreamName}${imageStreamTag ? `:${imageStreamTag}` : ''}`,
            resources: {
              requests: {
                cpu: `${cpuResource}`,
                memory: `${memoryResource}`,
              },
            },
          },
        },
      },
    },
  };

  return k8sCreate(ServiceModel, knativeDeployResource);
};

export const knativeServingResources = (namespace: string): FirehoseResource[] => {
  const knativeResource = [
    {
      isList: true,
      kind: referenceForModel(RevisionModel),
      namespace,
      prop: 'revisions',
    },
    {
      isList: true,
      kind: referenceForModel(ConfigurationModel),
      namespace,
      prop: 'configurations',
    },
    {
      isList: true,
      kind: referenceForModel(RouteModel),
      namespace,
      prop: 'ksroutes',
    },
    {
      isList: true,
      kind: referenceForModel(ServiceModel),
      namespace,
      prop: 'ksservices',
    },
  ];
  return knativeResource;
};
