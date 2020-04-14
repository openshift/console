import * as React from 'react';
import * as _ from 'lodash';
import { Kebab } from '@console/internal/components/utils';
import { RowFunction } from '@console/internal/components/factory';
import { CDSimpleRow } from '../../../vm-disks/cd-row';
import { VMWizardStorageBundle, VMWizardStorageRowCustomData } from '../storage-tab/types';
import { getActions } from '../storage-tab/vm-wizard-storage-row';

export const VmWizardVirtualHardwareRow: RowFunction<
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
    <CDSimpleRow
      data={{ ...restData, name }}
      validation={{
        content: validations.content || validations.url || validations.container || validations.pvc,
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
