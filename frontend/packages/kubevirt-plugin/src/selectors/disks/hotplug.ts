import { VMIKind, VMKind } from '../../types';

export const getHotplugDiskNames = (vmi: VMIKind) => {
  const hotplugVolumes = vmi?.status?.volumeStatus?.filter((vol) => vol.hotplugVolume);
  const hotplugDiskNames = hotplugVolumes?.map((htVol) => htVol.name);
  return hotplugDiskNames;
};

export const getAutoRemovedOrPersistentDiskName = (
  vm: VMKind,
  hotplugDiskNames: string[],
  isAutoRemove: boolean,
) => {
  const persistentDiskNames = vm?.spec?.template?.spec?.domain?.devices?.disks?.map(
    (pDisk) => pDisk.name,
  );
  return hotplugDiskNames?.filter((disk) =>
    isAutoRemove ? !persistentDiskNames?.includes(disk) : persistentDiskNames?.includes(disk),
  );
};

export const isHotplugDisk = (vmi: VMIKind, diskName: string) => {
  return getHotplugDiskNames(vmi)?.includes(diskName);
};

export const isAutoRemovedHotplugDisk = (vm: VMKind, vmi: VMIKind, diskName: string) => {
  const hotplugDiskNames = getHotplugDiskNames(vmi);
  return getAutoRemovedOrPersistentDiskName(vm, hotplugDiskNames, true)?.includes(diskName);
};
