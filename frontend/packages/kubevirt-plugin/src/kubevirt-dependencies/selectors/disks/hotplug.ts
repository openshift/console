import { VMKind } from '../../types/vm';
import { VMIKind } from '../../types/vmi';

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
    (pDisk) => pDisk.name,
  );
  return getHotplugDiskNames(vmi)?.filter((disk) =>
    isAutoRemove ? !persistentDiskNames?.includes(disk) : persistentDiskNames?.includes(disk),
  );
};
