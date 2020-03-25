import { ImagePullPolicy } from '@console/internal/module/k8s';
import { DeploymentWrappper } from '../../../wrapper/k8s/deployment-wrapper';

export const buildV2VVMwareDeployment = ({
  name,
  namespace,
  image,
  imagePullPolicy,
}: {
  name: string;
  namespace: string;
  image: string;
  imagePullPolicy: ImagePullPolicy;
}) => {
  return new DeploymentWrappper()
    .init({ name, namespace, replicas: 1 })
    .setSelector({
      matchLabels: {
        name,
      },
    })
    .setTemplate({
      metadata: {
        labels: {
          name,
        },
      },
      spec: {
        serviceAccountName: name,
        containers: [
          {
            name,
            image,
            imagePullPolicy,
            command: ['kubevirt-vmware'],
            env: [
              {
                name: 'WATCH_NAMESPACE',
                valueFrom: {
                  fieldRef: {
                    apiVersion: 'v1',
                    fieldPath: 'metadata.namespace',
                  },
                },
              },
              {
                name: 'POD_NAME',
                valueFrom: {
                  fieldRef: {
                    apiVersion: 'v1',
                    fieldPath: 'metadata.name',
                  },
                },
              },
              {
                name: 'OPERATOR_NAME',
                value: name,
              },
            ],
          },
        ],
      },
    })
    .asResource();
};
