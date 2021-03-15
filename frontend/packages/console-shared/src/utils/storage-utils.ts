import * as _ from 'lodash';
import { StorageClass } from '@console/internal/components/storage-class-form';

export const cephStorageProvisioners = [
  'ceph.rook.io/block',
  'cephfs.csi.ceph.com',
  'rbd.csi.ceph.com',
];

const objectStorageProvisioners = [
  'openshift-storage.noobaa.io/obc',
  'openshift-storage.ceph.rook.io/bucket',
];

// To check if the provisioner is OCS based
export const isCephProvisioner = (scProvisioner: string): boolean => {
  return cephStorageProvisioners.some((provisioner: string) =>
    _.endsWith(scProvisioner, provisioner),
  );
};

export const isObjectSC = (sc: StorageClass) => objectStorageProvisioners.includes(sc.provisioner);

export enum volumeModes {
  // ceph supported volum modes
  Block,
  Filesystem,
}

export const cephProvisionerAccessModes: {
  [key: string]: {
    [key in keyof typeof volumeModes]?: string[];
  };
} = {
  'openshift-storage.rbd.csi.ceph.com': {
    Block: ['ReadWriteOnce', 'ReadWriteMany'],
    Filesystem: ['ReadWriteOnce'],
  },
  'openshift-storage.cephfs.csi.ceph.com': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany'],
  },
};
