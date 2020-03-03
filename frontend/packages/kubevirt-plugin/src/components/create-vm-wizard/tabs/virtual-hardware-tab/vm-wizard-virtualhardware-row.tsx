import * as React from 'react';
import * as _ from 'lodash';
import { Kebab } from '@console/internal/components/utils';
import { CDSimpleRow } from '../../../vm-disks/cd-row';
import { VMWizardStorageBundle, VMWizardStorageRowCustomData } from '../storage-tab/types';
import { getActions } from '../storage-tab/vm-wizard-storage-row';

export type VmWizardVirtualHardwareRowProps = {
  obj: VMWizardStorageBundle;
  customData: VMWizardStorageRowCustomData;
  index: number;
  style: object;
};

export const VmWizardVirtualHardwareRow: React.FC<VmWizardVirtualHardwareRowProps> = ({
  obj: { name, wizardStorageData, ...restData },
  customData: { isDisabled, columnClasses, removeStorage, withProgress, wizardReduxID },
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
          options={getActions(wizardStorageData, { wizardReduxID, removeStorage, withProgress })}
          isDisabled={isDisabled}
          id={`kebab-for-${name}`}
        />
      }
    />
  );
};
