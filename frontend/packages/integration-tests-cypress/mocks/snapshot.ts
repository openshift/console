import type { Patch } from '@console/internal/module/k8s';
import { PVC_NAME } from './storage-common';

export const SNAPSHOT_NAME = `${PVC_NAME}-snapshot`;

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
    name: `${PVC_NAME}-snapshot-restore`,
    persistentVolumeClaim: {
      claimName: `${SNAPSHOT_NAME}-restore`,
    },
  },
};
