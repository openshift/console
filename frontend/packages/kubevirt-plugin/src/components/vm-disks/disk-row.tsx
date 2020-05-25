import * as React from 'react';
import { TableData, TableRow, RowFunction } from '@console/internal/components/factory';
import {
  asAccessReview,
  Kebab,
  KebabOption,
  LoadingInline,
} from '@console/internal/components/utils';
import { DASH, dimensifyRow, getDeletetionTimestamp } from '@console/shared';
import { TemplateModel } from '@console/internal/models';
import { deleteDiskModal } from '../modals/delete-disk-modal/delete-disk-modal';
import { VMLikeEntityKind } from '../../types/vmLike';
import { asVM, isVMRunning } from '../../selectors/vm';
import { isVM, isVMI } from '../../selectors/check-type';
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
import { validateDisk } from '../../utils/validations/vm/disk';

const menuActionEdit = (
  disk: CombinedDisk,
  vmLikeEntity: VMLikeEntityKind,
  { withProgress, templateValidations }: VMStorageRowActionOpts,
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
        templateValidations,
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
      deleteDiskModal({
        disk: disk.diskWrapper.asResource(true),
        volume: disk.volumeWrapper.asResource(true),
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

  if (disk.isEditingSupported()) {
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

export const DiskRow: RowFunction<StorageBundle, VMStorageRowCustomData> = ({
  obj: { disk, ...restData },
  customData: { isDisabled, withProgress, vmLikeEntity, columnClasses, templateValidations },
  index,
  style,
}) => {
  const diskValidations = validateDisk(
    disk.diskWrapper,
    disk.volumeWrapper,
    disk.dataVolumeWrapper,
    disk.persistentVolumeClaimWrapper,
    { templateValidations },
  );
  return (
    <DiskSimpleRow
      data={restData}
      validation={
        diskValidations && {
          name: diskValidations.validations.name,
          size: diskValidations.validations.size,
          diskInterface: diskValidations.validations.diskInterface,
          source:
            diskValidations.validations.url ||
            diskValidations.validations.container ||
            diskValidations.validations.pvc,
        }
      }
      columnClasses={columnClasses}
      index={index}
      style={style}
      actionsComponent={
        <Kebab
          options={getActions(disk, vmLikeEntity, {
            withProgress,
            templateValidations,
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
