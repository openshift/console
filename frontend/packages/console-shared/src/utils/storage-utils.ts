import { StorageClass } from '@console/internal/components/storage-class-form';

export const cephStorageProvisioners = [
  'ceph.rook.io/block',
  'cephfs.csi.ceph.com',
  'rbd.csi.ceph.com',
];

const objectStorageProvisioners = ['noobaa.io/obc', 'ceph.rook.io/bucket'];

// To check if the provisioner is OCS based
export const isCephProvisioner = (scProvisioner: string): boolean =>
  cephStorageProvisioners.some((provisioner: string) => scProvisioner?.includes(provisioner));

export const isObjectSC = (sc: StorageClass) =>
  objectStorageProvisioners.some((provisioner: string) => sc.provisioner?.includes(provisioner));
