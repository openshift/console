import * as _ from 'lodash';
import { StorageClass } from '@console/internal/components/storage-class-form';

export const cephStorageProvisioners = [
  'ceph.rook.io/block',
  'cephfs.csi.ceph.com',
  'rbd.csi.ceph.com',
];

// To check if the provisioner is OCS based
export const isCephProvisioner = (scProvisioner: string): boolean => {
  return cephStorageProvisioners.some((provisioner: string) =>
    _.endsWith(scProvisioner, provisioner),
  );
};

// To check that a storage class' provisioners don't include the specified provisioner
export const filterScOnProvisioner = (sc: StorageClass, provisioner: string = '') =>
  !sc.provisioner.includes(provisioner);
