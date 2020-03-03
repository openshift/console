export const CD_SIZE = 'size';
export const CD_STORAGE_CLASS = 'storageClass';

export const WINTOOLS_CONTAINER_NAMES = {
  openshift: 'registry.redhat.io/container-native-virtualization/virtio-win',
  ocp: 'registry.redhat.io/container-native-virtualization/virtio-win',
  online: 'registry.redhat.io/container-native-virtualization/virtio-win',
  dedicated: 'registry.redhat.io/container-native-virtualization/virtio-win',
  azure: 'registry.redhat.io/container-native-virtualization/virtio-win',
  okd: 'kubevirt/virtio-container-disk',
};

export const initialDisk = {
  container: 'path/to/container',
  url: 'http://path/to/iso',
  size: 10,
  isURLValid: true,
  changed: false,
};

export const StorageType = {
  WINTOOLS: 'windowsTools',
  CONTAINER: 'container',
  URL: 'url',
  PVC: 'pvc',
};
