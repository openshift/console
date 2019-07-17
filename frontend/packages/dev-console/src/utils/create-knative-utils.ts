import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/knative-plugin';
import { ServerlessScaling } from '../components/import/import-types';

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
