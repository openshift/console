export const CD_SIZE = 'size';
export const CD_STORAGE_CLASS = 'storageClass';

export const WINTOOLS_CONTAINER_NAMES = {
  openshift: 'virtio-win-container',
  ocp: 'virtio-win-container',
  online: 'virtio-win-container',
  dedicated: 'virtio-win-container',
  azure: 'virtio-win-container',
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
