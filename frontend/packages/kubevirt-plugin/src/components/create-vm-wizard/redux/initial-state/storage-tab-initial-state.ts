// left intentionally empty
import { ProvisionSource } from '../../../../types/vm';

const rootDisk = {
  rootStorage: {},
  name: 'rootdisk',
  isBootable: true,
};
export const rootContainerDisk = {
  ...rootDisk,
  // storageType: StorageType.CONTAINER, TODO!!
};
export const rootDataVolumeDisk = {
  ...rootDisk,
  // storageType: StorageType.DATAVOLUME, TODO!!
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
