import type { DeploymentKind } from '@console/internal/module/k8s';

// VolumeAttributesClass names and constants
export const VAC_NAME_1 = 'aws-ebs-gp3-high-iops';
export const VAC_NAME_2 = 'aws-ebs-gp3-low-iops';
export const VAC_INVALID = 'invalid-vac-1';
export const PVC_NAME = 'my-pvc-1';
export const DEPLOYMENT_NAME = 'my-deployment-1';

// AWS EBS CSI driver VolumeAttributesClass for high IOPS
export const VAC_1 = {
  apiVersion: 'storage.k8s.io/v1',
  kind: 'VolumeAttributesClass',
  metadata: {
    name: VAC_NAME_1,
  },
  driverName: 'ebs.csi.aws.com',
  parameters: {
    iops: '3000',
    throughput: '125',
    type: 'gp3',
  },
};

// AWS EBS CSI driver VolumeAttributesClass for low IOPS
export const VAC_2 = {
  apiVersion: 'storage.k8s.io/v1',
  kind: 'VolumeAttributesClass',
  metadata: {
    name: VAC_NAME_2,
  },
  driverName: 'ebs.csi.aws.com',
  parameters: {
    iops: '500',
    throughput: '125',
    type: 'gp3',
  },
};

// Invalid VAC with non-existent driver to trigger error state
export const VAC_INVALID_OBJ = {
  apiVersion: 'storage.k8s.io/v1',
  kind: 'VolumeAttributesClass',
  metadata: {
    name: VAC_INVALID,
  },
  driverName: 'non.existent.driver',
  parameters: {
    iops: '1000',
    throughput: '125',
    type: 'gp3',
  },
};

export const getDeployment = (namespace: string, pvcName: string): DeploymentKind => ({
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: DEPLOYMENT_NAME,
    namespace,
    labels: {
      app: 'my-app',
    },
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: 'my-app',
      },
    },
    template: {
      metadata: {
        labels: {
          app: 'my-app',
        },
      },
      spec: {
        containers: [
          {
            name: 'app-container',
            image: 'image-registry.openshift-image-registry.svc:5000/openshift/httpd:latest',
            ports: [{ containerPort: 80, protocol: 'TCP' }],
            volumeMounts: [
              {
                name: 'persistent-storage',
                mountPath: '/data',
              },
            ],
            resources: {
              requests: {
                memory: '128Mi',
                cpu: '100m',
              },
              limits: {
                memory: '256Mi',
                cpu: '200m',
              },
            },
          },
        ],
        volumes: [
          {
            name: 'persistent-storage',
            persistentVolumeClaim: {
              claimName: pvcName,
            },
          },
        ],
      },
    },
  },
});
