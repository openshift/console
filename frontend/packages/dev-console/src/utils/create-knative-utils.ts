import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/knative-plugin';

export const createKnativeService = (
  name: string,
  namespace: string,
  imageStreamName: string,
  imageStreamTag: string,
  cpuResource: string = '100m',
  memoryResource: string = '100Mi',
): Promise<K8sResourceKind> => {
  const knativeDeployResource = {
    kind: 'Service',
    apiVersion: 'serving.knative.dev/v1alpha1',
    metadata: {
      name,
      namespace,
    },
    spec: {
      runLatest: {
        configuration: {
          revisionTemplate: {
            spec: {
              container: {
                image: `${imageStreamName}:${imageStreamTag}`,
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
      },
    },
  };

  return k8sCreate(ServiceModel, knativeDeployResource);
};
