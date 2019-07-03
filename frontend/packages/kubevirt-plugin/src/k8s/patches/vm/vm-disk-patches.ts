import { getName } from '@console/shared';
import { getAddDiskPatch, getDeviceBootOrderPatch } from 'kubevirt-web-ui-components';
import {
  getDataVolumeTemplates,
  getDiskBootOrder,
  getDisks,
  getVolumeDataVolumeName,
  getVolumes,
} from '../../../selectors/vm';
import { getVmLikePatches } from '../vm-template';
import { Patch, VMLikeEntityKind } from '../../../types';

export const getRemoveDiskPatches = (vmLikeEntity: VMLikeEntityKind, disk): Patch[] => {
  return getVmLikePatches(vmLikeEntity, (vm) => {
    const diskName = disk.name;
    const disks = getDisks(vm);
    const volumes = getVolumes(vm);

    const diskIndex = disks.findIndex((d) => d.name === diskName);
    const volumeIndex = volumes.findIndex((v) => v.name === diskName);

    const patches: Patch[] = [];

    if (diskIndex >= 0) {
      patches.push({
        op: 'remove',
        path: `/spec/template/spec/domain/devices/disks/${diskIndex}`,
      });
    }

    if (volumeIndex >= 0) {
      patches.push({
        op: 'remove',
        path: `/spec/template/spec/volumes/${volumeIndex}`,
      });
    }

    const dataVolumeName = getVolumeDataVolumeName(volumes[volumeIndex]);

    if (dataVolumeName) {
      const dataVolumeIndex = getDataVolumeTemplates(vm).findIndex(
        (dataVolume) => getName(dataVolume) === dataVolumeName,
      );
      if (dataVolumeIndex >= 0) {
        patches.push({
          op: 'remove',
          path: `/spec/dataVolumeTemplates/${dataVolumeIndex}`,
        });
      }
    }

    const bootOrderIndex = getDiskBootOrder(disk);
    if (bootOrderIndex != null) {
      return [...patches, ...getDeviceBootOrderPatch(vm, 'disks', diskName)];
    }

    return patches;
  });
};

export const getAddDiskPatches = (vmLikeEntity: VMLikeEntityKind, disk: object): Patch[] => {
  return getVmLikePatches(vmLikeEntity, (vm) => {
    return getAddDiskPatch(vm, disk);
  });
};
