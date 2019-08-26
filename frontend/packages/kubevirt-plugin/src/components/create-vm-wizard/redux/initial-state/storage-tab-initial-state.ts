// left intentionally empty
import { ProvisionSource } from '../../../../types/vm';
import { StorageType } from '../../../../constants/vm/storage';

const rootDisk = {
  rootStorage: {},
  name: 'rootdisk',
  isBootable: true,
};
export const rootContainerDisk = {
  ...rootDisk,
  storageType: StorageType.CONTAINER,
};
export const rootDataVolumeDisk = {
  ...rootDisk,
  storageType: StorageType.DATAVOLUME,
  size: 10,
};
export const getInitialDisk = (provisionSource: ProvisionSource) => {
  switch (provisionSource) {
    case ProvisionSource.URL:
      return rootDataVolumeDisk;
    case ProvisionSource.CONTAINER:
      return rootContainerDisk;
    default:
      return null;
  }
};

export const getStorageInitialState = () => ({
  value: [],
  isValid: true, // empty Storages are valid
  hasAllRequiredFilled: true,
});
