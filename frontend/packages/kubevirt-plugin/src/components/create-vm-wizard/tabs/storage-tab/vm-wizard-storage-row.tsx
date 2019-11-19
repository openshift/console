import * as React from 'react';
import * as _ from 'lodash';
import { Kebab, KebabOption } from '@console/internal/components/utils';
import { VMWizardStorageType, VMWizardStorageWithWrappers } from '../../types';
import { DiskSimpleRow } from '../../../vm-disks/disk-row';
import {
  VMWizardStorageBundle,
  VMWizardStorageRowActionOpts,
  VMWizardStorageRowCustomData,
} from './types';
import { vmWizardStorageModalEnhanced } from './vm-wizard-storage-modal-enhanced';

const menuActionEdit = (
  storageWithWrappers: VMWizardStorageWithWrappers,
  { wizardReduxID, withProgress }: VMWizardStorageRowActionOpts,
): KebabOption => ({
  label: 'Edit',
  callback: () =>
    withProgress(
      vmWizardStorageModalEnhanced({
        blocking: true,
        wizardReduxID,
        storage: storageWithWrappers,
      }).result,
    ),
});

const menuActionRemove = (
  { id, type }: VMWizardStorageWithWrappers,
  { withProgress, removeStorage }: VMWizardStorageRowActionOpts,
): KebabOption => ({
  label: 'Delete',
  isDisabled: [
    VMWizardStorageType.PROVISION_SOURCE_DISK,
    VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK,
    VMWizardStorageType.V2V_VMWARE_IMPORT_TEMP,
  ].includes(type),
  callback: () =>
    withProgress(
      new Promise((resolve) => {
        removeStorage(id);
        resolve();
      }),
    ),
});

const getActions = (
  wizardNetworkData: VMWizardStorageWithWrappers,
  opts: VMWizardStorageRowActionOpts,
) => [menuActionEdit, menuActionRemove].map((a) => a(wizardNetworkData, opts));

export type VMWizardNicRowProps = {
  obj: VMWizardStorageBundle;
  customData: VMWizardStorageRowCustomData;
  index: number;
  style: object;
};

export const VmWizardStorageRow: React.FC<VMWizardNicRowProps> = ({
  obj: { name, wizardStorageData, ...restData },
  customData: { isDisabled, columnClasses, removeStorage, withProgress, wizardReduxID },
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
      }}
      columnClasses={columnClasses}
      index={index}
      style={style}
      actionsComponent={
        <Kebab
          options={getActions(wizardStorageData, { wizardReduxID, removeStorage, withProgress })}
          isDisabled={isDisabled}
          id={`kebab-for-${name}`}
        />
      }
    />
  );
};
