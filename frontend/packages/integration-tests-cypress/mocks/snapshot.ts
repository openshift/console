import { Patch } from '@console/internal/module/k8s';

export const testerDeployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'busybox-deployment',
    labels: {
      app: 'busybox',
    },
  },
  spec: {
    replicas: 1,
    strategy: {
      type: 'RollingUpdate',
    },
    selector: {
      matchLabels: {
        app: 'busybox',
      },
    },
    template: {
      metadata: {
        labels: {
          app: 'busybox',
        },
      },
      spec: {
        volumes: [
          {
            name: 'testpvc',
            persistentVolumeClaim: {
              claimName: 'testpvc',
            },
          },
        ],
        containers: [
          {
            name: 'busybox',
            image: 'busybox',
            imagePullPolicy: 'IfNotPresent',
            volumeDevices: [
              {
                name: 'testpvc',
                devicePath: '/data',
              },
            ],
            command: ['sh', '-c', 'echo Container 1 is Running ; sleep 3600'],
          },
        ],
      },
      nodeSelector: {
        overload: 'true',
      },
    },
  },
};

export const PVC = {
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: {
    name: 'testpvc',
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

export const PVCGP3 = {
  apiVersion: PVC.apiVersion,
  kind: PVC.kind,
  metadata: {
    name: 'testpvcgp3',
  },
  spec: {
    storageClassName: 'gp3-csi',
    accessModes: PVC.spec.accessModes,
    resources: {
      requests: {
        storage: PVC.spec.resources.requests.storage,
      },
    },
  },
};

export const SnapshotClass = {
  apiVersion: 'snapshot.storage.k8s.io/v1',
  kind: 'VolumeSnapshotClass',
  metadata: {
    name: 'csi-hostpath-snapclass',
  },
  driver: 'ebs.csi.aws.com',
  deletionPolicy: 'Delete',
};

export const patchForVolume: Patch = {
  op: 'add',
  path: '/spec/template/spec/volumes/-',
  value: {
    name: 'testpvc-snapshot-restore',
    persistentVolumeClaim: {
      claimName: 'testpvc-snapshot-restore',
    },
  },
};
