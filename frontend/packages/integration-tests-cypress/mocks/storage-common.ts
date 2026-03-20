export const PVC_NAME = 'testpvc';
export const DEPLOYMENT_NAME = 'busybox-deployment';

export const PVC = {
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: {
    name: PVC_NAME,
  },
  spec: {
    storageClassName: 'gp2-csi',
    accessModes: ['ReadWriteOnce'],
    resources: {
      requests: {
        storage: '1Gi',
      },
    },
  },
};

export const testerDeploymentWithMounts = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: { name: DEPLOYMENT_NAME, labels: { app: 'busybox' } },
  spec: {
    replicas: 1,
    selector: { matchLabels: { app: 'busybox' } },
    template: {
      metadata: { labels: { app: 'busybox' } },
      spec: {
        volumes: [{ name: PVC_NAME, persistentVolumeClaim: { claimName: PVC_NAME } }],
        containers: [
          {
            name: 'busybox',
            image: 'busybox',
            imagePullPolicy: 'IfNotPresent',
            volumeMounts: [{ name: PVC_NAME, mountPath: '/data' }],
            command: ['sh', '-c', 'echo Container 1 is Running ; sleep 3600'],
          },
        ],
      },
    },
  },
};
