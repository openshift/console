import * as React from 'react';
import { RowFunction, TableData, TableRow } from '@console/internal/components/factory';
import {
  asAccessReview,
  Kebab,
  KebabOption,
  LoadingInline,
  ResourceLink,
} from '@console/internal/components/utils';
import { PersistentVolumeClaimModel, TemplateModel } from '@console/internal/models';
import { CombinedDisk } from '../../k8s/wrapper/vm/combined-disk';
import { VirtualMachineModel } from '../../models';
import { getDeletetionTimestamp } from '../../selectors';
import { isVM, isVMI } from '../../selectors/check-type';
import { isAutoRemovedHotplugDisk, isHotplugDisk } from '../../selectors/disks/hotplug';
import { asVM, isVMRunningOrExpectedRunning } from '../../selectors/vm';
import { isVMIRunning } from '../../selectors/vmi';
import { VMIKind } from '../../types';
import { VMLikeEntityKind } from '../../types/vmLike';
import { DASH, dimensifyRow } from '../../utils';
import { validateDisk } from '../../utils/validations/vm/disk';
import { deleteDiskModal } from '../modals/delete-disk-modal/delete-disk-modal';
import { diskModalEnhanced } from '../modals/disk-modal/disk-modal-enhanced';
import { ValidationCell } from '../table/validation-cell';
import { VMNicRowActionOpts } from '../vm-nics/types';
import { VMLabel } from '../VMLabel';
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
  { withProgress, templateValidations }: VMStorageRowActionOpts,
): KebabOption => ({
  // t('kubevirt-plugin~Edit')
  labelKey: 'kubevirt-plugin~Edit',
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
  vmi?: VMIKind,
): KebabOption => ({
  // t('kubevirt-plugin~Delete')
  labelKey: 'kubevirt-plugin~Delete',
  callback: () =>
    withProgress(
      deleteDiskModal({
        disk: disk.diskWrapper.asResource(true),
        volume: disk.volumeWrapper.asResource(true),
        vmLikeEntity,
        vmi: vmi || undefined,
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
  vmi?: VMIKind,
) => {
  const actions = [];
  const isVMRunning = isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi);
  if (isVMI(vmLikeEntity)) {
    return actions;
  }

  if (disk.isEditingSupported() && !isVMRunning) {
    actions.push(menuActionEdit);
  }

  actions.push(menuActionDelete);
  return actions.map((a) =>
    !isVMRunning ? a(disk, vmLikeEntity, opts) : a(disk, vmLikeEntity, opts, vmi),
  );
};

export type VMDiskSimpleRowProps = {
  data: StorageSimpleData;
  validation?: StorageSimpleDataValidation;
  columnClasses: string[];
  actionsComponent: React.ReactNode;
  index: number;
  style: object;
  isHotplug?: boolean;
  isAutoRemovedHotplug?: boolean;
  isVmi?: boolean;
};

export const DiskSimpleRow: React.FC<VMDiskSimpleRowProps> = ({
  data: { name, source, size, diskInterface, storageClass, type, disk },
  validation = {},
  columnClasses,
  actionsComponent,
  index,
  style,
  isHotplug,
  isAutoRemovedHotplug,
  isVmi,
}) => {
  const dimensify = dimensifyRow(columnClasses);

  const isSizeLoading = size === undefined;
  const isStorageClassLoading = size === undefined;
  const pvcName = disk?.persistentVolumeClaimWrapper?.getName();
  const pvcNamespace = disk?.persistentVolumeClaimWrapper?.getNamespace();
  const pvcLink = pvcName && pvcNamespace && (
    <ResourceLink
      inline
      kind={PersistentVolumeClaimModel.kind}
      name={pvcName}
      namespace={pvcNamespace}
    />
  );
  return (
    <TableRow id={name} index={index} trKey={name} style={style}>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.name}>
          {name}{' '}
          {isHotplug && !isVmi && (
            <VMLabel
              indication={isAutoRemovedHotplug ? 'AutoDetachHotplug' : 'PersistingHotplug'}
            />
          )}
        </ValidationCell>
      </TableData>
      <TableData className={dimensify()}>
        <ValidationCell validation={validation.source}>{pvcLink || source || DASH}</ValidationCell>
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
  customData: { isDisabled, withProgress, vmLikeEntity, vmi, columnClasses, templateValidations },
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
  const isHotplug =
    isHotplugDisk(vmi, disk.getName()) &&
    (isVMI(vmLikeEntity)
      ? isVMIRunning(vmi)
      : isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi));
  const isAutoRemovedHotplug =
    isAutoRemovedHotplugDisk(asVM(vmLikeEntity), vmi, disk.getName()) &&
    (isVMI(vmLikeEntity)
      ? isVMIRunning(vmi)
      : isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi));
  const isVmi = isVMI(vmLikeEntity);
  return (
    <DiskSimpleRow
      data={{ disk, ...restData }}
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
      isHotplug={isHotplug}
      isAutoRemovedHotplug={isAutoRemovedHotplug}
      isVmi={isVmi}
      actionsComponent={
        <Kebab
          options={getActions(
            disk,
            vmLikeEntity,
            {
              withProgress,
              templateValidations,
            },
            vmi,
          )}
          isDisabled={
            isDisabled ||
            isVMI(vmLikeEntity) ||
            !!getDeletetionTimestamp(vmLikeEntity) ||
            (!isHotplug && isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi))
          }
          id={`kebab-for-${disk.getName()}`}
        />
      }
    />
  );
};
