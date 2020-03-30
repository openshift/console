import * as React from 'react';
import { Button, Split, SplitItem, TextInput, ButtonVariant } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { VMImportProvider, VMWareProviderField } from '../../../../types';
import {
  iGetVMWareField,
  iGetVMWareFieldValue,
} from '../../../../selectors/immutable/provider/vmware/selectors';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { FormFieldRow } from '../../../../form/form-field-row';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { isFieldDisabled } from '../../../../selectors/immutable/field';
import { iGet } from '../../../../../../utils/immutable';
import {
  PROVIDER_VMWARE_CHECK_CONNECTION_BTN_DONT_SAVE,
  PROVIDER_VMWARE_CHECK_CONNECTION_BTN_SAVE,
} from '../../../../strings/vmware';
import { getCheckConnectionAction } from '../../../../redux/stateUpdate/vmSettings/providers/vmware/vmware-provider-actions';

const VMWarePasswordConnected: React.FC<VMWareSecretsConnectedProps> = React.memo(
  ({
    passwordField,
    rememberPassword,
    onPasswordChange,
    hasAllPrerequisiteValuesFiled,
    onCheckConnection,
  }) => (
    <FormFieldRow field={passwordField} fieldType={FormFieldType.TEXT}>
      <Split>
        <SplitItem isFilled>
          <FormField>
            <TextInput onChange={onPasswordChange} type="password" />
          </FormField>
        </SplitItem>
        <SplitItem>
          <Button
            id="vcenter-connect"
            isDisabled={!hasAllPrerequisiteValuesFiled || isFieldDisabled(passwordField)}
            onClick={onCheckConnection}
            variant={ButtonVariant.secondary}
          >
            {rememberPassword
              ? PROVIDER_VMWARE_CHECK_CONNECTION_BTN_SAVE
              : PROVIDER_VMWARE_CHECK_CONNECTION_BTN_DONT_SAVE}
          </Button>
        </SplitItem>
      </Split>
    </FormFieldRow>
  ),
);

type VMWareSecretsConnectedProps = {
  rememberPassword: boolean;
  passwordField: any;
  hasAllPrerequisiteValuesFiled: boolean;
  onPasswordChange: (password: string) => void;
  onCheckConnection: () => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  const passwordField = iGetVMWareField(
    state,
    wizardReduxID,
    VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION,
  );
  const hasAllPrerequisiteValuesFiled =
    iGet(passwordField, 'value') &&
    iGetVMWareFieldValue(state, wizardReduxID, VMWareProviderField.HOSTNAME) &&
    iGetVMWareFieldValue(state, wizardReduxID, VMWareProviderField.USER_NAME);
  return {
    passwordField,
    hasAllPrerequisiteValuesFiled,
    rememberPassword: !!iGetVMWareFieldValue(
      state,
      wizardReduxID,
      VMWareProviderField.REMEMBER_PASSWORD,
    ),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onCheckConnection: () => dispatch(getCheckConnectionAction(wizardReduxID)),
  onPasswordChange: (password) =>
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.VMWARE,
        VMWareProviderField.USER_PASSWORD_AND_CHECK_CONNECTION,
        { value: password },
      ),
    ),
});

export const VMWarePassword = connect(stateToProps, dispatchToProps)(VMWarePasswordConnected);
