import i18next from 'i18next';
import * as _ from 'lodash';

export const cephRBDProvisionerSuffix = 'rbd.csi.ceph.com';

export const snapshotPVCStorageClassAnnotation = 'snapshot.storage.kubernetes.io/pvc-storage-class';
export const snapshotPVCAccessModeAnnotation = 'snapshot.storage.kubernetes.io/pvc-access-modes';
export const snapshotPVCVolumeModeAnnotation = 'snapshot.storage.kubernetes.io/pvc-volume-mode';

type AccessMode = 'ReadWriteOnce' | 'ReadWriteMany' | 'ReadOnlyMany' | 'ReadWriteOncePod';
type VolumeMode = 'Filesystem' | 'Block';

export const initialAccessModes: AccessMode[] = [
  'ReadWriteOnce',
  'ReadWriteMany',
  'ReadOnlyMany',
  'ReadWriteOncePod',
];
export const initialVolumeModes: VolumeMode[] = ['Filesystem', 'Block'];

type PartialMatch = { partialMatch?: boolean };
type ModeMapping = {
  [volumeMode in VolumeMode]?: AccessMode[];
};
type AccessModeMapping = ModeMapping & PartialMatch;

type ProvisionerAccessModeMapping = {
  [provisioner: string]: AccessModeMapping;
};

// See https://kubernetes.io/docs/concepts/storage/persistent-volumes/#types-of-persistent-volumes and
// https://docs.openshift.com/container-platform/4.15/storage/understanding-persistent-storage.html for more details
export const provisionerAccessModeMapping: ProvisionerAccessModeMapping = Object.freeze({
  'kubernetes.io/no-provisioner': {
    Filesystem: ['ReadWriteOnce'],
    Block: ['ReadWriteOnce'],
  },
  'kubernetes.io/aws-ebs': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteOncePod'],
    Block: ['ReadWriteOnce', 'ReadWriteOncePod'],
  },
  'kubernetes.io/gce-pd': {
    Filesystem: ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteOncePod'],
    Block: ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteOncePod'],
  },
  'kubernetes.io/glusterfs': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany', 'ReadWriteOncePod'],
    Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany', 'ReadWriteOncePod'],
  },
  'kubernetes.io/cinder': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteOncePod', 'ReadWriteOncePod'],
    Block: ['ReadWriteOnce', 'ReadWriteOncePod', 'ReadWriteOncePod'],
  },
  'kubernetes.io/azure-file': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany', 'ReadWriteOncePod'],
    Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany', 'ReadWriteOncePod'],
  },
  'kubernetes.io/azure-disk': {
    Filesystem: ['ReadWriteOnce'],
    Block: ['ReadWriteOnce'],
  },
  'kubernetes.io/quobyte': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
    Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
  },
  'kubernetes.io/rbd': {
    Filesystem: ['ReadWriteOnce', 'ReadOnlyMany'],
    Block: ['ReadWriteOnce', 'ReadOnlyMany'],
  },
  'kubernetes.io/vsphere-volume': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany'],
    Block: ['ReadWriteOnce', 'ReadWriteMany'],
  },
  'kubernetes.io/portworx-volume': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany'],
    Block: ['ReadWriteOnce', 'ReadWriteMany'],
  },
  'kubernetes.io/scaleio': {
    Filesystem: ['ReadWriteOnce', 'ReadOnlyMany'],
    Block: ['ReadWriteOnce', 'ReadOnlyMany'],
  },
  'kubernetes.io/storageos': {
    Filesystem: ['ReadWriteOnce'],
    Block: ['ReadWriteOnce'],
  },
  // Since 4.6 new provisioners names will be without the 'kubernetes.io/' prefix.
  'manila.csi.openstack.org': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
    Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany'],
  },
  'ebs.csi.aws.com': {
    Filesystem: ['ReadWriteOnce'],
    Block: ['ReadWriteOnce'],
  },
  'block.csi.ibm.com': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany'],
    Block: ['ReadWriteOnce', 'ReadWriteMany'],
  },
  'csi.ovirt.org': {
    Filesystem: ['ReadWriteOnce'],
    Block: ['ReadWriteOnce'],
  },
  'cinder.csi.openstack.org': {
    Filesystem: ['ReadWriteOnce'],
    Block: ['ReadWriteOnce'],
  },
  'pd.csi.storage.gke.io': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteOncePod'],
    Block: ['ReadWriteOnce', 'ReadWriteOncePod'],
  },
  'cephfs.csi.ceph.com': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany', 'ReadWriteOncePod'],
    partialMatch: true,
  },
  'rbd.csi.ceph.com': {
    Filesystem: ['ReadWriteOnce', 'ReadOnlyMany', 'ReadWriteOncePod'],
    Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany', 'ReadWriteOncePod'],
    partialMatch: true,
  },
  'file.csi.azure.com': {
    Filesystem: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany', 'ReadWriteOncePod'],
    Block: ['ReadWriteOnce', 'ReadWriteMany', 'ReadOnlyMany', 'ReadWriteOncePod'],
  },
});

export const getAccessModeOptions = () => [
  {
    value: 'ReadWriteOnce',
    title: i18next.t('public~Single user (RWO)'),
  },
  {
    value: 'ReadWriteMany',
    title: i18next.t('public~Shared access (RWX)'),
  },
  {
    value: 'ReadOnlyMany',
    title: i18next.t('public~Read only (ROX)'),
  },
  {
    value: 'ReadWriteOncePod',
    title: i18next.t('public~Read write once pod (RWOP)'),
  },
];

export const getVolumeModeRadios = () => [
  {
    value: 'Filesystem',
    title: i18next.t('public~Filesystem'),
  },
  {
    value: 'Block',
    title: i18next.t('public~Block'),
  },
];

export const dropdownUnits = {
  i: 'B',
  Ki: 'KiB',
  Mi: 'MiB',
  Gi: 'GiB',
  Ti: 'TiB',
  Pi: 'PiB',
  Ei: 'EiB',
};

export const getProvisionerModeMapping = (provisioner: string): ModeMapping =>
  _.omit(
    _.find(provisionerAccessModeMapping, (value: AccessModeMapping, key: string) => {
      if (value?.partialMatch && provisioner?.includes(key)) {
        return true;
      }
      if (key === provisioner) {
        return true;
      }
      return false;
    }) || {},
    'partialMatch',
  );

export const getAccessModeForProvisioner = (
  provisioner: string,
  ignoreReadOnly?: boolean,
  volumeMode?: string,
): AccessMode[] => {
  let accessModes: AccessMode[];
  const modeMapping: ModeMapping = getProvisionerModeMapping(provisioner);

  if (!_.isEmpty(modeMapping)) {
    accessModes = volumeMode
      ? modeMapping[volumeMode]
      : Object.keys(modeMapping)
          .map((mode) => modeMapping[mode])
          .flat();
  } else {
    accessModes = initialAccessModes;
  }

  // remove duplicate in accessModes
  accessModes = [...new Set(accessModes)];

  // Ignore ReadOnly related access for create-pvc
  return ignoreReadOnly ? accessModes.filter((modes) => modes !== 'ReadOnlyMany') : accessModes;
};

export const getVolumeModeForProvisioner = (
  provisioner: string,
  accessMode: string,
): VolumeMode[] => {
  const modeMapping: ModeMapping = getProvisionerModeMapping(provisioner);

  if (!_.isEmpty(modeMapping)) {
    return accessMode
      ? (Object.keys(modeMapping).filter((volumeMode) =>
          modeMapping[volumeMode].includes(accessMode),
        ) as VolumeMode[])
      : (Object.keys(modeMapping) as VolumeMode[]);
  }
  return initialVolumeModes;
};
