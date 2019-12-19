import { getName } from '@console/shared/src';
import { Patch, k8sGet } from '@console/internal/module/k8s';
import { PatchBuilder } from '@console/shared/src/k8s';
import {
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getVolumeDataVolumeName,
  getVolumes,
} from '../../../selectors/vm';
import { getVMLikePatches } from '../vm-template';
import { VMLikeEntityKind } from '../../../types';
import { getSimpleName } from '../../../selectors/utils';
import { DiskWrapper } from '../../wrapper/vm/disk-wrapper';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { getStorageClassConfigMap } from '../../requests/config-map/storage-class';
import { DataVolumeWrapper } from '../../wrapper/vm/data-volume-wrapper';
import {
  getDefaultSCAccessMode,
  getDefaultSCVolumeMode,
} from '../../../selectors/config-map/sc-defaults';
import { getShiftBootOrderPatches } from './utils';

export const getRemoveDiskPatches = (vmLikeEntity: VMLikeEntityKind, disk): Patch[] => {
  return getVMLikePatches(vmLikeEntity, (vm) => {
    const diskWrapper = DiskWrapper.initialize(disk);
    const diskName = diskWrapper.getName();
    const disks = getDisks(vm);
    const volumes = getVolumes(vm);
    const volume = volumes.find((v) => getSimpleName(v) === diskName);

    const patches = [
      new PatchBuilder('/spec/template/spec/domain/devices/disks')
        .setListRemove(disk, disks, getSimpleName)
        .build(),
      new PatchBuilder('/spec/template/spec/volumes')
        .setListRemove(volume, volumes, getSimpleName)
        .build(),
    ];

    const dataVolumeName = getVolumeDataVolumeName(volume);

    if (dataVolumeName) {
      patches.push(
        new PatchBuilder('/spec/dataVolumeTemplates')
          .setListRemoveSimpleValue(dataVolumeName, getDataVolumeTemplates(vm), getName)
          .build(),
      );
    }

    if (diskWrapper.hasBootOrder()) {
      return [
        ...patches,
        ...getShiftBootOrderPatches(
          '/spec/template/spec/domain/devices/disks',
          disks,
          diskName,
          diskWrapper.getBootOrder(),
        ),
        ...getShiftBootOrderPatches(
          '/spec/template/spec/domain/devices/interfaces',
          getInterfaces(vm),
          null,
          diskWrapper.getBootOrder(),
        ),
      ];
    }

    return patches;
  });
};

export const getUpdateDiskPatches = async (
  vmLikeEntity: VMLikeEntityKind,
  {
    disk,
    volume,
    dataVolume,
    oldDiskName,
    oldVolumeName,
    oldDataVolumeName,
  }: {
    disk: V1Disk;
    volume: V1Volume;
    dataVolume: V1alpha1DataVolume;
    oldDiskName: string;
    oldVolumeName: string;
    oldDataVolumeName: string;
  },
): Promise<Patch[]> => {
  let finalDataVolume;
  if (dataVolume) {
    const dataVolumeWrapper = DataVolumeWrapper.initialize(dataVolume);
    const storageClassConfigMap = await getStorageClassConfigMap({ k8sGet });
    const storageClassName = dataVolumeWrapper.getStorageClassName();

    finalDataVolume = DataVolumeWrapper.mergeWrappers(
      DataVolumeWrapper.initializeFromSimpleData({
        accessModes: [getDefaultSCAccessMode(storageClassConfigMap, storageClassName)],
        volumeMode: getDefaultSCVolumeMode(storageClassConfigMap, storageClassName),
      }),
      dataVolumeWrapper,
    ).asResource();
  }
  return getVMLikePatches(vmLikeEntity, (vm) => {
    const disks = getDisks(vm, null);
    const volumes = getVolumes(vm, null);
    const dataVolumeTemplates = getDataVolumeTemplates(vm, null);

    return [
      new PatchBuilder('/spec/template/spec/domain/devices/disks')
        .setListUpdate(disk, disks, getSimpleName, oldDiskName)
        .build(),
      new PatchBuilder('/spec/template/spec/volumes')
        .setListUpdate(volume, volumes, getSimpleName, oldVolumeName)
        .build(),
      finalDataVolume &&
        new PatchBuilder('/spec/dataVolumeTemplates')
          .setListUpdate(finalDataVolume, dataVolumeTemplates, getName, oldDataVolumeName)
          .build(),
    ].filter((patch) => patch);
  });
};
