import * as React from 'react';
import { TableData, TableRow } from '@console/internal/components/factory';
import {
  asAccessReview,
  Kebab,
  KebabOption,
  LoadingInline,
} from '@console/internal/components/utils';
import { DASH, dimensifyRow, getDeletetionTimestamp } from '@console/shared';
import { TemplateModel } from '@console/internal/models';
import { deleteDeviceModal, DeviceType } from '../modals/delete-device-modal';
import { VMLikeEntityKind } from '../../types/vmLike';
import { asVM, isVM, isVMI, isVMRunning } from '../../selectors/vm';
import { VirtualMachineModel } from '../../models';
import { ValidationCell } from '../table/validation-cell';
import { VMNicRowActionOpts } from '../vm-nics/types';
import { diskModalEnhanced } from '../modals/disk-modal/disk-modal-enhanced';
import { CombinedDisk } from '../../k8s/wrapper/vm/combined-disk';
import {
  StorageBundle,
  StorageSimpleData,
  StorageSimpleDataValidation,
  VMStorageRowActionOpts,
  VMStorageRowCustomData,
} from './types';

const menuActionEdit = (
  disk: CombinedDisk,
  vmLikeEntity: VMLikeEntityKind,
  { withProgress }: VMNicRowActionOpts,
): KebabOption => ({
  label: 'Edit',
  callback: () =>
    withProgress(
      diskModalEnhanced({
        vmLikeEntity,
        isEditing: true,
        blocking: true,
        disk: disk.diskWrapper.asResource(),
        volume: disk.volumeWrapper.asResource(),
        dataVolume: disk.dataVolumeWrapper && disk.dataVolumeWrapper.asResource(),
      }).result,
    ),
  accessReview: asAccessReview(
    isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
    vmLikeEntity,
    'patch',
  ),
});

const menuActionDelete = (
  disk: CombinedDisk,
  vmLikeEntity: VMLikeEntityKind,
  { withProgress }: VMNicRowActionOpts,
): KebabOption => ({
  label: 'Delete',
  callback: () =>
    withProgress(
      deleteDeviceModal({
        deviceType: DeviceType.DISK,
        device: disk.diskWrapper.asResource(),
        vmLikeEntity,
      }).result,
    ),
  accessReview: asAccessReview(
    isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel,
    vmLikeEntity,
    'patch',
  ),
});

const getActions = (
  disk: CombinedDisk,
  vmLikeEntity: VMLikeEntityKind,
  opts: VMStorageRowActionOpts,
) => {
  const actions = [];
  if (isVMI(vmLikeEntity) || isVMRunning(asVM(vmLikeEntity))) {
    return actions;
  }

  const isTemplate = vmLikeEntity && !isVM(vmLikeEntity);
  if (disk.isEditingSupported(isTemplate)) {
    actions.push(menuActionEdit);
  }

  actions.push(menuActionDelete);
  return actions.map((a) => a(disk, vmLikeEntity, opts));
};

export type VMDiskSimpleRowProps = {
  data: StorageSimpleData;
  validation?: StorageSimpleDataValidation;
  columnClasses: string[];
  actionsComponent: React.ReactNode;
  index: number;
  style: object;
};

export const DiskSimpleRow: React.FC<VMDiskSimpleRowProps> = ({
  data: { name, source, size, diskInterface, storageClass },
  validation = {},
  columnClasses,
  actionsComponent,
  index,
  style,
}) => {
  const dimensify = dimensifyRow(columnClasses);

  const isSizeLoading = size === undefined;
  const isStorageClassLoading = size === undefined;
  return (
    <TableRow id={name} index={index} trKey={name} style={style}>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.name}>{name}</ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.source}>{source || DASH}</ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        {isSizeLoading && <LoadingInline />}
        {!isSizeLoading && (
          <ValidationCell validation={validation.size}>{size || DASH}</ValidationCell>
        )}
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.diskInterface}>{diskInterface}</ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        {isStorageClassLoading && <LoadingInline />}
        {!isStorageClassLoading && (
          <ValidationCell validation={validation.storageClass}>
            {storageClass || DASH}
          </ValidationCell>
        )}
      </TableData>
      <TableData className={dimensify(true)}>{actionsComponent}</TableData>
    </TableRow>
  );
};

export type VMDiskRowProps = {
  obj: StorageBundle;
  customData: VMStorageRowCustomData;
  index: number;
  style: object;
};

export const DiskRow: React.FC<VMDiskRowProps> = ({
  obj: { disk, ...restData },
  customData: { isDisabled, withProgress, vmLikeEntity, columnClasses },
  index,
  style,
}) => {
  return (
    <DiskSimpleRow
      data={restData}
      columnClasses={columnClasses}
      index={index}
      style={style}
      actionsComponent={
        <Kebab
          options={getActions(disk, vmLikeEntity, {
            withProgress,
          })}
          isDisabled={
            isDisabled ||
            isVMI(vmLikeEntity) ||
            !!getDeletetionTimestamp(vmLikeEntity) ||
            isVMRunning(asVM(vmLikeEntity))
          }
          id={`kebab-for-${disk.getName()}`}
        />
      }
    />
  );
};
