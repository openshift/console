import { ConfigMapKind } from '@console/internal/module/k8s';

import { generateDataVolumeName } from '.';
import {
  DataVolumeSourceType,
  DiskBus,
  DiskType,
  DUMMY_VM_NAME,
  ROOT_DISK_INSTALL_NAME,
  VolumeType,
} from '../constants';
import { DataVolumeWrapper } from '../k8s/wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../k8s/wrapper/vm/volume-wrapper';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../selectors/config-map/sc-defaults';

export const getEmptyInstallStorage = (
  scConfigMap: ConfigMapKind,
  bus = DiskBus.VIRTIO,
  vmName = DUMMY_VM_NAME,
) => {
  const dataVolumeName = generateDataVolumeName(vmName, ROOT_DISK_INSTALL_NAME);
  return {
    disk: new DiskWrapper()
      .init({ name: ROOT_DISK_INSTALL_NAME, bootOrder: 2 })
      .setType(DiskType.DISK, { bus })
      .asResource(),
    volume: new VolumeWrapper()
      .init({ name: ROOT_DISK_INSTALL_NAME })
      .setType(VolumeType.DATA_VOLUME, { name: dataVolumeName })
      .asResource(),
    dataVolume: new DataVolumeWrapper()
      .init({ name: dataVolumeName, size: 20, unit: 'Gi' })
      .setType(DataVolumeSourceType.BLANK)
      .setAccessModes(getDefaultSCAccessModes(scConfigMap))
      .setVolumeMode(getDefaultSCVolumeMode(scConfigMap))
      .asResource(),
  };
};
