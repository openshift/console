import * as React from 'react';
import * as _ from 'lodash';
import { Kebab, KebabOption } from '@console/internal/components/utils';
import { RowFunction } from '@console/internal/components/factory';
import { VMWizardStorage, VMWizardStorageType } from '../../types';
import { DiskSimpleRow } from '../../../vm-disks/disk-row';
import {
  VMWizardStorageBundle,
  VMWizardStorageRowActionOpts,
  VMWizardStorageRowCustomData,
} from './types';
import { vmWizardStorageModalEnhanced } from './vm-wizard-storage-modal-enhanced';

const menuActionEdit = (
  wizardStorageData: VMWizardStorage,
  { wizardReduxID, withProgress, isUpdateDisabled }: VMWizardStorageRowActionOpts,
): KebabOption => {
  return {
    label: 'Edit',
    isDisabled: !!isUpdateDisabled,
    callback: () =>
      withProgress(
        vmWizardStorageModalEnhanced({
          blocking: true,
          isEditing: true,
          wizardReduxID,
          storage: wizardStorageData,
        }).result,
      ),
  };
};

const menuActionRemove = (
  { id, type }: VMWizardStorage,
  { withProgress, removeStorage, isDeleteDisabled }: VMWizardStorageRowActionOpts,
): KebabOption => ({
  label: 'Delete',
  isDisabled:
    isDeleteDisabled ||
    [
      VMWizardStorageType.PROVISION_SOURCE_DISK,
      VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK,
    ].includes(type),
  callback: () =>
    withProgress(
      new Promise((resolve) => {
        removeStorage(id);
        resolve();
      }),
    ),
});

export const getActions = (
  wizardStorageData: VMWizardStorage,
  opts: VMWizardStorageRowActionOpts,
) => [menuActionEdit, menuActionRemove].map((a) => a(wizardStorageData, opts));

export const VmWizardStorageRow: RowFunction<
  VMWizardStorageBundle,
  VMWizardStorageRowCustomData
> = ({
  obj: { name, wizardStorageData, ...restData },
  customData: {
    isDisabled,
    columnClasses,
    removeStorage,
    withProgress,
    wizardReduxID,
    isDeleteDisabled,
    isUpdateDisabled,
  },
  index,
  style,
}) => {
  const validations = _.get(wizardStorageData, ['validation', 'validations'], {});
  return (
    <DiskSimpleRow
      data={{ ...restData, name }}
      validation={{
        name: validations.name || validations.url || validations.container || validations.pvc,
        size: validations.size,
        diskInterface: validations.diskInterface,
      }}
      columnClasses={columnClasses}
      index={index}
      style={style}
      actionsComponent={
        <Kebab
          options={getActions(wizardStorageData, {
            wizardReduxID,
            removeStorage,
            withProgress,
            isDeleteDisabled,
            isUpdateDisabled,
          })}
          isDisabled={isDisabled}
          id={`kebab-for-${name}`}
        />
      }
    />
  );
};
