import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import { VMImportProvider, VMWareProviderField, VMWareProviderProps } from '../../../../types';
import { iGetVMWareField } from '../../../../selectors/immutable/provider/vmware/selectors';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { FormFieldRow } from '../../../../form/form-field-row';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { FormSelectPlaceholderOption } from '../../../../../form/form-select-placeholder-option';
import { getPlaceholder } from '../../../../utils/renderable-field-utils';
import { ignoreCaseSort } from '../../../../../../utils/sort';
import { requestVmDetails } from '../../../../redux/state-update/providers/vmware/vmware-provider-actions';

const VMWareVMsConnected: React.FC<VMWareVMsConnectedProps> = React.memo(
  ({ vmField, v2vvmware, onVMChange }) => {
    const iVMs = iGetIn(v2vvmware, ['data', 'spec', 'vms']);
    let vmNames;
    if (iVMs) {
      vmNames = ignoreCaseSort(
        iVMs
          .map((vm) => vm.get('name'))
          .toSetSeq()
          .toArray(),
      );
    }

    return (
      <FormFieldRow field={vmField} fieldType={FormFieldType.SELECT}>
        <FormField>
          <FormSelect onChange={onVMChange}>
            <FormSelectPlaceholderOption
              placeholder={getPlaceholder(VMWareProviderField.VM)}
              isDisabled={!!iGet(vmField, 'value')}
            />
            {vmNames &&
              vmNames.map((name) => (
                <FormSelectOption key={name} value={name} label={decodeURIComponent(name)} />
              ))}
          </FormSelect>
        </FormField>
      </FormFieldRow>
    );
  },
);

type VMWareVMsConnectedProps = {
  vmField: any;
  v2vvmware: any;
  onVMChange: (vm: string) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  return {
    vmField: iGetVMWareField(state, wizardReduxID, VMWareProviderField.VM),
    v2vvmware: iGetCommonData(state, wizardReduxID, VMWareProviderProps.v2vvmware),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onVMChange: (vm) => {
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.VMWARE,
        VMWareProviderField.VM,
        { value: vm, vm: null },
      ),
    );
    dispatch(requestVmDetails(wizardReduxID, vm));
  },
});

export const VMWareVMs = connect(stateToProps, dispatchToProps)(VMWareVMsConnected);
