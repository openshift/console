import { ExtensionSCProvisionerProp } from '@console/plugin-sdk';
import { PoolResourceComponent } from '../components/ocs-storage-class-form';
import { CEPH_STORAGE_NAMESPACE } from '../constants';

export const StorageClassFormProvisoners: ExtensionSCProvisionerProp = Object.freeze({
  csi: {
    'openshift-storage.rbd.csi.ceph.com': {
      title: 'Ceph RBD',
      provisioner: 'rbd.csi.ceph.com',
      parameters: {
        clusterID: {
          name: 'Cluster ID',
          hintText: 'The namespace where Ceph is deployed',
          value: CEPH_STORAGE_NAMESPACE,
          visible: () => false,
        },
        pool: {
          name: 'Pool',
          hintText: 'Ceph pool into which volume data shall be stored',
          required: true,
          Component: PoolResourceComponent,
        },
        imageFormat: {
          name: 'Image Format',
          hintText: 'RBD image format. Defaults to "2"',
          value: '2',
          visible: () => false,
        },
        imageFeatures: {
          name: 'Image Features',
          hintText: 'Ceph RBD image features',
          value: 'layering',
          visible: () => false,
        },
        'csi.storage.k8s.io/provisioner-secret-name': {
          name: 'Provisioner Secret Name',
          hintText: 'The name of provisioner secret',
          value: 'rook-csi-rbd-provisioner',
          visible: () => false,
        },
        'csi.storage.k8s.io/provisioner-secret-namespace': {
          name: 'Provisioner Secret Namespace',
          hintText: 'The namespace where provisioner secret is created',
          value: CEPH_STORAGE_NAMESPACE,
          visible: () => false,
        },
        'csi.storage.k8s.io/node-stage-secret-name': {
          name: 'Node Stage Secret Name',
          hintText: 'The name of Node Stage secret',
          value: 'rook-csi-rbd-node',
          visible: () => false,
        },
        'csi.storage.k8s.io/node-stage-secret-namespace': {
          name: 'Node Stage Secret Namespace',
          hintText: 'The namespace where provisioner secret is created',
          value: CEPH_STORAGE_NAMESPACE,
          visible: () => false,
        },
        'csi.storage.k8s.io/fstype': {
          name: 'Filesystem Type',
          hintText: 'Ceph RBD filesystem type. Default set to ext4',
          value: 'ext4',
          visible: () => false,
        },
      },
    },
    'openshift-storage.cephfs.csi.ceph.com': {
      title: 'Ceph FS',
      provisioner: 'cephfs.csi.ceph.com',
      parameters: {
        clusterID: {
          name: 'Cluster ID',
          hintText: 'The namespace where Ceph is deployed',
          value: CEPH_STORAGE_NAMESPACE,
          visible: () => false,
        },
        fsName: {
          name: 'Filesystem Name',
          hintText: 'CephFS filesystem name into which the volume shall be created',
          required: true,
        },
        'csi.storage.k8s.io/provisioner-secret-name': {
          name: 'Provisioner Secret Name',
          hintText: 'The name of provisioner secret',
          value: 'rook-csi-cephfs-provisioner',
          visible: () => false,
        },
        'csi.storage.k8s.io/provisioner-secret-namespace': {
          name: 'Provisioner Secret Namespace',
          hintText: 'The namespace where provisioner secret is created',
          value: CEPH_STORAGE_NAMESPACE,
          visible: () => false,
        },
        'csi.storage.k8s.io/node-stage-secret-name': {
          name: 'Node Stage Secret Name',
          hintText: 'The name of Node Stage secret',
          value: 'rook-csi-cephfs-node',
          visible: () => false,
        },
        'csi.storage.k8s.io/node-stage-secret-namespace': {
          name: 'Node Stage Secret Namespace',
          hintText: 'The namespace where provisioner secret is created',
          value: CEPH_STORAGE_NAMESPACE,
          visible: () => false,
        },
      },
    },
  },
});
