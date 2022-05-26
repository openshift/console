import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DeploymentStrategyType } from '../deployment-strategy/utils/types';

export const getDefaultDeployment = (namespace: string, kind: string): K8sResourceKind => {
  const defaultDeployment: K8sResourceKind = {
    apiVersion:
      kind === DeploymentModel.kind
        ? `${DeploymentModel.apiGroup}/${DeploymentModel.apiVersion}`
        : `${DeploymentConfigModel.apiGroup}/${DeploymentConfigModel.apiVersion}`,
    kind: kind === DeploymentModel.kind ? DeploymentModel.kind : DeploymentConfigModel.kind,
    metadata: {
      namespace,
      name: '',
    },
    spec: {
      selector: kind === DeploymentModel.kind ? { matchLabels: { app: 'name' } } : {},
      replicas: 3,
      template: {
        metadata: {
          labels: kind === DeploymentModel.kind ? { app: 'name' } : {},
        },
        spec: {
          containers: [
            {
              name: 'container',
              image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
              ports: [
                {
                  containerPort: 8080,
                  protocol: 'TCP',
                },
              ],
            },
          ],
        },
      },
      strategy:
        kind === DeploymentModel.kind
          ? {
              type: DeploymentStrategyType.rollingUpdate,
              rollingUpdate: {
                maxSurge: '25%',
                maxUnavailable: '25%',
              },
            }
          : {
              type: DeploymentStrategyType.rollingParams,
              rollingParams: {
                updatePeriodSeconds: 1,
                intervalSeconds: 1,
                timeoutSeconds: 600,
                maxUnavailable: '25%',
                maxSurge: '25%',
              },
            },
      ...(kind !== DeploymentModel.kind
        ? {
            triggers: [
              {
                type: 'ConfigChange',
              },
            ],
          }
        : {}),
    },
  };

  return defaultDeployment;
};
