import * as React from 'react';
import * as _ from 'lodash';
import { Kebab, KebabOption } from '@console/internal/components/utils';
import { RowFunction } from '@console/internal/components/factory';
import { NicSimpleRow } from '../../../vm-nics/nic-row';
import { VMWizardNetworkWithWrappers } from '../../types';
import { VMWizardNetworkBundle, VMWizardNicRowActionOpts, VMWizardNicRowCustomData } from './types';
import { vmWizardNicModalEnhanced } from './vm-wizard-nic-modal-enhanced';

const menuActionEdit = (
  { networkInterfaceWrapper, networkWrapper, id, type }: VMWizardNetworkWithWrappers,
  { wizardReduxID, withProgress }: VMWizardNicRowActionOpts,
): KebabOption => ({
  label: 'Edit',
  callback: () =>
    withProgress(
      vmWizardNicModalEnhanced({
        blocking: true,
        wizardReduxID,
        id,
        type,
        networkInterfaceWrapper,
        networkWrapper,
      }).result,
    ),
});

const menuActionRemove = (
  { id }: VMWizardNetworkWithWrappers,
  { withProgress, removeNIC }: VMWizardNicRowActionOpts,
): KebabOption => ({
  label: 'Delete',
  callback: () =>
    withProgress(
      new Promise((resolve) => {
        removeNIC(id);
        resolve();
      }),
    ),
});

const getActions = (
  wizardNetworkData: VMWizardNetworkWithWrappers,
  opts: VMWizardNicRowActionOpts,
) => {
  const actions = [menuActionEdit, menuActionRemove];
  return actions.map((a) => a(wizardNetworkData, opts));
};

export const VMWizardNicRow: RowFunction<VMWizardNetworkBundle, VMWizardNicRowCustomData> = ({
  obj: { name, wizardNetworkData, ...restData },
  customData: { isDisabled, columnClasses, removeNIC, withProgress, wizardReduxID },
  index,
  style,
}) => {
  return (
    <NicSimpleRow
      data={{ ...restData, name }}
      validation={_.get(wizardNetworkData, ['validation', 'validations'])}
      columnClasses={columnClasses}
      index={index}
      style={style}
      actionsComponent={
        <Kebab
          options={getActions(wizardNetworkData, { wizardReduxID, removeNIC, withProgress })}
          isDisabled={isDisabled}
          id={`kebab-for-${name}`}
        />
      }
    />
  );
};
