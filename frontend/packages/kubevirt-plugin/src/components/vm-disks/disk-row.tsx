import * as React from 'react';

import { TableData, TableRow } from '@console/internal/components/factory';
import {
  asAccessReview,
  Kebab,
  KebabOption,
  LoadingInline,
} from '@console/internal/components/utils';
import { getDeletetionTimestamp, DASH } from '@console/shared';

import { TemplateModel } from '@console/internal/models';
import { BUS_VIRTIO } from '../../constants/vm';
import { deleteDeviceModal, DeviceType } from '../modals/delete-device-modal';
import { VMLikeEntityKind } from '../../types';
import {
  getDiskBus,
  getVolumeDataVolumeName,
  getVolumePersistentVolumeClaimName,
} from '../../selectors/vm';
import {
  getDataVolumeStorageClassName,
  getDataVolumeStorageSize,
} from '../../selectors/dv/selectors';
import { getPvcStorageClassName, getPvcStorageSize } from '../../selectors/pvc/selectors';
import { VMDiskRowProps } from './types';
import { VirtualMachineModel } from '../../models';
import { isVm } from '../../selectors/selectors';

const menuActionDelete = (vmLikeEntity: VMLikeEntityKind, disk): KebabOption => ({
  label: 'Delete',
  callback: () =>
    deleteDeviceModal({
      deviceType: DeviceType.DISK,
      device: disk,
      vmLikeEntity,
    }),
  accessReview: asAccessReview(
    isVm(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
    vmLikeEntity,
    'patch',
  ),
});

const getActions = (vmLikeEntity: VMLikeEntityKind, disk) => {
  const actions = [menuActionDelete];
  return actions.map((a) => a(vmLikeEntity, disk));
};

export const DiskRow: React.FC<VMDiskRowProps> = ({
  obj: { disk },
  customData: {
    vmLikeEntity,
    pvcs,
    datavolumes,
    datavolumeLookup,
    pvcLookup,
    volumeLookup,
    datavolumeTemplatesLookup,
  },
  index,
  style,
}) => {
  const diskName = disk.name;
  const volume = volumeLookup[diskName];

  const pvcName = getVolumePersistentVolumeClaimName(volume);
  const dataVolumeName = getVolumeDataVolumeName(volume);

  let sizeColumn;
  let storageColumn;

  if (pvcName) {
    const pvc = pvcLookup[pvcName];
    if (pvc) {
      sizeColumn = getPvcStorageSize(pvc);
      storageColumn = getPvcStorageClassName(pvc);
    } else if (!pvcs.loaded) {
      sizeColumn = <LoadingInline />;
      storageColumn = <LoadingInline />;
    }
  } else if (dataVolumeName) {
    const dataVolumeTemplate =
      datavolumeTemplatesLookup[dataVolumeName] || datavolumeLookup[dataVolumeName];

    if (dataVolumeTemplate) {
      sizeColumn = getDataVolumeStorageSize(dataVolumeTemplate);
      storageColumn = getDataVolumeStorageClassName(dataVolumeTemplate);
    } else if (!datavolumes.loaded) {
      sizeColumn = <LoadingInline />;
      storageColumn = <LoadingInline />;
    }
  }

  return (
    <TableRow id={diskName} index={index} trKey={diskName} style={style}>
      <TableData>{diskName}</TableData>
      <TableData>{sizeColumn || DASH}</TableData>
      <TableData>{getDiskBus(disk, BUS_VIRTIO)}</TableData>
      <TableData>{storageColumn || DASH}</TableData>
      <TableData className={Kebab.columnClass}>
        <Kebab
          options={getActions(vmLikeEntity, disk)}
          key={`kebab-for--${diskName}`}
          isDisabled={getDeletetionTimestamp(vmLikeEntity)}
          id={`kebab-for-${diskName}`}
        />
      </TableData>
    </TableRow>
  );
};
