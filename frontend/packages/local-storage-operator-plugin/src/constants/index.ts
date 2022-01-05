import { TFunction } from 'i18next';
import { DiskMechanicalProperties } from '../components/local-volume-set/types';

export const diskModeDropdownItems = Object.freeze({
  BLOCK: 'Block',
  FILESYSTEM: 'Filesystem',
});

export const ZONE_LABELS = [
  'topology.kubernetes.io/zone',
  'failure-domain.beta.kubernetes.io/zone', // deprecated
];

export const DISK_TYPES: {
  [key: string]: {
    property: keyof typeof DiskMechanicalProperties;
  };
} = {
  SSD: {
    property: 'NonRotational',
  },
  HDD: {
    property: 'Rotational',
  },
};
export const deviceTypeDropdownItems = Object.freeze({
  DISK: 'Disk',
  PART: 'Part',
});

export const fsTypeDropdownItems = Object.freeze({
  EXT4: 'ext4',
  EXT3: 'ext3',
  XFS: 'xfs',
});

export const diskTypeDropdownItems = (t: TFunction) =>
  Object.freeze({
    All: t('lso-plugin~All'),
    SSD: t('lso-plugin~SSD / NVMe'),
    HDD: t('lso-plugin~HDD'),
  });

export const AUTO_DISCOVER_ERR_MSG = 'Failed to update the Auto Detect Volume!';

export const diskSizeUnitOptions = {
  Ti: 'TiB',
  Gi: 'GiB',
};

export const DISCOVERY_CR_NAME = 'auto-discover-devices';
export const LOCAL_STORAGE_NAMESPACE = 'openshift-local-storage';
export const HOSTNAME_LABEL_KEY = 'kubernetes.io/hostname';
export const LABEL_OPERATOR = 'In';
