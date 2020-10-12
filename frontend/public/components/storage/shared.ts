import { isCephProvisioner } from '@console/shared/src/utils';

export const cephRBDProvisionerSuffix = 'rbd.csi.ceph.com';
//See https://kubernetes.io/docs/concepts/storage/persistent-volumes/#types-of-persistent-volumes for more details
export const provisionerAccessModeMapping = {
  'kubernetes.io/no-provisioner': ['ReadWriteOnce'],
  'kubernetes.io/aws-ebs': ['ReadWriteOnce'],
  'kubernetes.io/gce-pd': ['ReadWriteOnce', 'ReadOnlyMany'],
  'kubernetes.io/glusterfs': ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
  'kubernetes.io/cinder': ['ReadWriteOnce'],
  'kubernetes.io/azure-file': ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
  'kubernetes.io/azure-disk': ['ReadWriteOnce'],
  'kubernetes.io/quobyte': ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
  'kubernetes.io/rbd': ['ReadWriteOnce', 'ReadOnlyMany'],
  'kubernetes.io/vsphere-volume': ['ReadWriteOnce', 'ReadWriteMany'],
  'kubernetes.io/portworx-volume': ['ReadWriteOnce', 'ReadWriteMany'],
  'kubernetes.io/scaleio': ['ReadWriteOnce', 'ReadOnlyMany'],
  'kubernetes.io/storageos': ['ReadWriteOnce'],
  // Since 4.6 new provisioners names will be without the 'kubernetes.io/' prefix.
  'manila.csi.openstack.org': ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
  'ebs.csi.aws.com': ['ReadWriteOnce'],
  'csi.ovirt.org': ['ReadWriteOnce'],
};
export const initialAccessModes = ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'];
export const accessModeRadios = [
  {
    value: 'ReadWriteOnce',
    title: 'Single User (RWO)',
  },
  {
    value: 'ReadWriteMany',
    title: 'Shared Access (RWX)',
  },
  {
    value: 'ReadOnlyMany',
    title: 'Read Only (ROX)',
  },
];
export const dropdownUnits = {
  Mi: 'MiB',
  Gi: 'GiB',
  Ti: 'TiB',
};
export const getAccessModeForProvisioner = (provisioner: string) => {
  return provisioner && isCephProvisioner(provisioner)
    ? ['ReadWriteOnce', 'ReadWriteMany']
    : ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'];
};
