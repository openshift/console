import { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';

export const deploymentHasCpuAndMemoryLimits = {
  kind: 'Deployment',
  apiVersion: 'apps/v1',
  metadata: {
    name: 'nodejs-rest-http-with-resource-limits',
    namespace: 'test-ns',
  },
};

export const deploymentConfigHasCpuAndMemoryLimits = {
  kind: 'DeploymentConfig',
  apiVersion: 'apps.openshift.io/v1',
  metadata: {
    name: 'nodejs-rest-http-crud-resource-limits',
    namespace: 'test-ns',
  },
};

export const cpuScaled: HorizontalPodAutoscalerKind = {
  kind: 'HorizontalPodAutoscaler',
  apiVersion: 'autoscaling/v2beta2',
  metadata: {
    name: 'example',
    namespace: 'test-ns',
  },
  spec: {
    scaleTargetRef: {
      kind: 'DeploymentConfig',
      name: 'nodejs-rest-http-crud-resource-limits',
      apiVersion: 'apps.openshift.io/v1',
    },
    minReplicas: 2,
    maxReplicas: 10,
    metrics: [
      {
        type: 'Resource',
        resource: {
          name: 'cpu',
          target: {
            type: 'Utilization',
            averageUtilization: 42,
          },
        },
      },
    ],
  },
};
