import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
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
import { asVM, isVMRunningOrExpectedRunning } from '../../selectors/vm';
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
  t: TFunction,
  { withProgress, templateValidations }: VMStorageRowActionOpts,
): KebabOption => ({
  label: t('kubevirt-plugin~Edit'),
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
  t: TFunction,
  { withProgress }: VMNicRowActionOpts,
): KebabOption => ({
  label: t('kubevirt-plugin~Delete'),
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
  t: TFunction,
  opts: VMStorageRowActionOpts,
) => {
  const actions = [];
  if (isVMI(vmLikeEntity) || isVMRunningOrExpectedRunning(asVM(vmLikeEntity))) {
    return actions;
  }

  if (disk.isEditingSupported()) {
    actions.push(menuActionEdit);
  }

  actions.push(menuActionDelete);
  return actions.map((a) => a(disk, vmLikeEntity, t, opts));
};

export type VMDiskSimpleRowProps = {
  data: StorageSimpleData;
  validation?: StorageSimpleDataValidation;
  columnClasses: string[];
  actionsComponent: React.ReactNode;
  index: number;
  style: object;
  isPendingRestart?: boolean;
};

export const DiskSimpleRow: React.FC<VMDiskSimpleRowProps> = ({
  data: { name, source, size, diskInterface, storageClass, type },
  validation = {},
  columnClasses,
  actionsComponent,
  index,
  style,
  isPendingRestart,
}) => {
  const { t } = useTranslation();
  const dimensify = dimensifyRow(columnClasses);

  const isSizeLoading = size === undefined;
  const isStorageClassLoading = size === undefined;
  return (
    <TableRow id={name} index={index} trKey={name} style={style}>
      <TableData className={dimensify()}>
        <ValidationCell
          validation={validation.name}
          additionalLabel={isPendingRestart ? t('kubevirt-plugin~(pending restart)') : null}
        >
          {name}
        </ValidationCell>
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
        <ValidationCell validation={validation.type}>{type?.toString()}</ValidationCell>
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
  customData: {
    isDisabled,
    withProgress,
    vmLikeEntity,
    columnClasses,
    templateValidations,
    pendingChangesDisks,
  },
  index,
  style,
}) => {
  const { t } = useTranslation();
  const diskValidations = validateDisk(
    disk.diskWrapper,
    disk.volumeWrapper,
    disk.dataVolumeWrapper,
    disk.persistentVolumeClaimWrapper,
    { templateValidations },
  );
  const isPendingRestart = !!pendingChangesDisks?.has(restData.name);
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
      isPendingRestart={isPendingRestart}
      columnClasses={columnClasses}
      index={index}
      style={style}
      actionsComponent={
        <Kebab
          options={getActions(disk, vmLikeEntity, t, {
            withProgress,
            templateValidations,
          })}
          isDisabled={
            isDisabled ||
            isVMI(vmLikeEntity) ||
            !!getDeletetionTimestamp(vmLikeEntity) ||
            isVMRunningOrExpectedRunning(asVM(vmLikeEntity))
          }
          id={`kebab-for-${disk.getName()}`}
        />
      }
    />
  );
};
