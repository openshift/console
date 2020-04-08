import { connect } from 'react-redux';
import * as React from 'react';
import { Checkbox, TextInput } from '@patternfly/react-core';
import {
  iGetVMwareData,
  isVMWareProvider,
} from '../../../../selectors/immutable/provider/vmware/selectors';
import { VMImportProvider, VMWareProviderField } from '../../../../types';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { FormFieldMemoRow } from '../../../../form/form-field-row';
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { getFieldId } from '../../../../utils/renderable-field-utils';
import { FormFieldReviewContext } from '../../../../form/form-field-review-context';
import { VMWareControllerStatusRow } from './vmware-controller-status-row';
import { VMWareControllerErrors } from './vmware-controller-errors';
import { VMWareSecrets } from './vmware-secrets';
import { VMWarePassword } from './vmware-password';
import { VMWareObjectStatus } from './vmware-object-status';
import { VMWareVMs } from './vmware-vms';

class VMWareImportProviderConnected extends React.Component<VMWareImportProviderProps> {
  // helpers
  getField = (key: VMWareProviderField) => iGet(this.props.vmWareData, key);

  getValue = (key: VMWareProviderField) => iGetIn(this.props.vmWareData, [key, 'value']);

  onChange = (key: VMWareProviderField) => (value) => this.props.onFieldChange(key, { value });

  render() {
    const { wizardReduxID, isVMWare } = this.props;

    if (!isVMWare) {
      return null;
    }

    return (
      <FormFieldReviewContext.Consumer>
        {({ isReview }: { isReview: boolean }) => (
          <>
            {!isReview && (
              <>
                <VMWareSecrets key="secrets" wizardReduxID={wizardReduxID} />
                <FormFieldMemoRow
                  key={VMWareProviderField.HOSTNAME}
                  field={this.getField(VMWareProviderField.HOSTNAME)}
                  fieldType={FormFieldType.TEXT}
                >
                  <FormField>
                    <TextInput onChange={this.onChange(VMWareProviderField.HOSTNAME)} />
                  </FormField>
                </FormFieldMemoRow>
                <FormFieldMemoRow
                  key={VMWareProviderField.USER_NAME}
                  field={this.getField(VMWareProviderField.USER_NAME)}
                  fieldType={FormFieldType.TEXT}
                >
                  <FormField>
                    <TextInput onChange={this.onChange(VMWareProviderField.USER_NAME)} />
                  </FormField>
                </FormFieldMemoRow>
                <VMWarePassword key="password" wizardReduxID={wizardReduxID} />
                <FormFieldMemoRow
                  key={FormFieldType.INLINE_CHECKBOX}
                  field={this.getField(VMWareProviderField.REMEMBER_PASSWORD)}
                  fieldType={FormFieldType.INLINE_CHECKBOX}
                >
                  <FormField>
                    <Checkbox
                      className="kubevirt-create-vm-modal__remember-password"
                      id={getFieldId(VMWareProviderField.REMEMBER_PASSWORD)}
                      onChange={this.onChange(VMWareProviderField.REMEMBER_PASSWORD)}
                    />
                  </FormField>
                </FormFieldMemoRow>
              </>
            )}
            <VMWareVMs key="vms" wizardReduxID={wizardReduxID} />
            {!isReview && (
              <>
                <VMWareControllerErrors key="errors" wizardReduxID={wizardReduxID} />
                <VMWareControllerStatusRow
                  key="controllerstatus-row"
                  wizardReduxID={wizardReduxID}
                  id="v2v-vmware-status"
                />
                <VMWareObjectStatus key="object-status" wizardReduxID={wizardReduxID} />
              </>
            )}
          </>
        )}
      </FormFieldReviewContext.Consumer>
    );
  }
}

type VMWareImportProviderProps = {
  isVMWare: boolean;
  vmWareData: any;
  wizardReduxID: string;
  onFieldChange: (key: VMWareProviderField, value: any) => void;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isVMWare: isVMWareProvider(state, wizardReduxID),
  vmWareData: iGetVMwareData(state, wizardReduxID),
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onFieldChange: (key: VMWareProviderField, value: any) =>
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.VMWARE,
        key,
        value,
      ),
    ),
});

export const VMWareImportProvider = connect(
  stateToProps,
  dispatchToProps,
)(VMWareImportProviderConnected);
