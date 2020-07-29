export const diskModeDropdownItems = Object.freeze({
  BLOCK: 'Block',
  FILESYSTEM: 'Filesystem',
});
export const diskTypeDropdownItems = Object.freeze({
  SSD: 'SSD / NVMe',
  HDD: 'HDD',
});

export const allNodesSelectorTxt =
  'Selecting all nodes will use the available disks that match the selected filters on all nodes.';

export const AUTO_DISCOVER_ERR_MSG = 'Failed to update the Auto Detect Volume!';

export const diskSizeUnitOptions = {
  TiB: 'TiB',
  GiB: 'GiB',
};

export const DISCOVERY_CR_NAME = 'auto-discover-devices';
export const LOCAL_STORAGE_NAMESPACE = 'openshift-local-storage';
export const HOSTNAME_LABEL_KEY = 'kubernetes.io/hostname';
export const LABEL_OPERATOR = 'In';
