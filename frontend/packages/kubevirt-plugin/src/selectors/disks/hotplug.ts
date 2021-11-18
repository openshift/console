import { VMIKind, VMKind } from '../../types';

export const getHotplugDiskNames = (vmi: VMIKind) => {
  const hotplugVolumes = vmi?.status?.volumeStatus?.filter((vol) => vol.hotplugVolume);
  const hotplugDiskNames = hotplugVolumes?.map((htVol) => htVol.name);
  return hotplugDiskNames;
};

export const getAutoRemovedOrPersistentDiskName = (
  vm: VMKind,
  vmi: VMIKind,
  isAutoRemove: boolean,
) => {
  const persistentDiskNames = vm?.spec?.template?.spec?.domain?.devices?.disks?.map(
    (pDisk) => pDisk?.name,
  );
  return getHotplugDiskNames(vmi)?.filter((disk) =>
    isAutoRemove ? !persistentDiskNames?.includes(disk) : persistentDiskNames?.includes(disk),
  );
};

export const isHotplugDisk = (vmi: VMIKind, diskName: string) => {
  return getHotplugDiskNames(vmi)?.includes(diskName);
};

export const isAutoRemovedHotplugDisk = (vm: VMKind, vmi: VMIKind, diskName: string) => {
  return getAutoRemovedOrPersistentDiskName(vm, vmi, true)?.includes(diskName);
};

export const getVMIHotplugVolumeSnapshotStatuses = (vm: VMKind, vmi: VMIKind) => {
  return getAutoRemovedOrPersistentDiskName(vm, vmi, true)?.map((diskName) => ({
    enabled: false,
    name: diskName,
    reason: 'Volume snapshots are not supported for auto-detach hotplug volumes.',
  }));
};
