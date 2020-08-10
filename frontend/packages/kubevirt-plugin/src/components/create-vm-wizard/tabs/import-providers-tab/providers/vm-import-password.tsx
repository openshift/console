import * as React from 'react';
import { Button, Split, SplitItem, TextInput, ButtonVariant } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { OvirtProviderField, VMImportProvider, VMWareProviderField } from '../../../types';
import { vmWizardActions } from '../../../redux/actions';
import { ActionType } from '../../../redux/types';
import { FormFieldRow } from '../../../form/form-field-row';
import { FormField, FormFieldType } from '../../../form/form-field';
import { isFieldDisabled } from '../../../selectors/immutable/field';
import { iGet } from '../../../../../utils/immutable';
import {
  PROVIDER_V2V_CHECK_CONNECTION_BTN_DONT_SAVE,
  PROVIDER_V2V_CHECK_CONNECTION_BTN_SAVE,
} from '../../../strings/v2v';
import { getCheckConnectionAction as ovirtGetCheckConnectionAction } from '../../../redux/state-update/providers/ovirt/ovirt-provider-actions';
import { getCheckConnectionAction as vmwareGetCheckConnectionAction } from '../../../redux/state-update/providers/vmware/vmware-provider-actions';
import {
  iGetProviderField,
  iGetProviderFieldAttribute,
  iGetProviderFieldValue,
} from '../../../selectors/immutable/provider/common';
import { iGetOvirtFieldValue } from '../../../selectors/immutable/provider/ovirt/selectors';
import { ValidationErrorType } from '@console/shared';

const VMImportPasswordConnected: React.FC<VMImportPasswordConnectedProps> = React.memo(
  ({
    provider,
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
            id={`provider-${provider.toLowerCase()}-connect`}
            isDisabled={!hasAllPrerequisiteValuesFiled || isFieldDisabled(passwordField)}
            onClick={onCheckConnection}
            variant={ButtonVariant.secondary}
          >
            {rememberPassword
              ? PROVIDER_V2V_CHECK_CONNECTION_BTN_SAVE
              : PROVIDER_V2V_CHECK_CONNECTION_BTN_DONT_SAVE}
          </Button>
        </SplitItem>
      </Split>
    </FormFieldRow>
  ),
);

type VMImportPasswordConnectedProps = {
  rememberPassword: boolean;
  passwordField: any;
  hasAllPrerequisiteValuesFiled: boolean;
  onPasswordChange: (password: string) => void;
  onCheckConnection: () => void;
  provider: VMImportProvider;
};

const stateToProps = (state, { wizardReduxID, provider }) => {
  const passwordField = iGetProviderField(
    state,
    wizardReduxID,
    provider,
    OvirtProviderField.PASSWORD,
    VMWareProviderField.PASSWORD,
  );

  const validationField = iGetProviderFieldAttribute(
    state,
    wizardReduxID,
    provider,
    'validation',
    OvirtProviderField.API_URL,
    VMWareProviderField.HOSTNAME,
  );
  const isValidationCritical = [
    ValidationErrorType.TrivialError,
    ValidationErrorType.Error,
  ].includes(iGet(validationField, 'type'));

  let hasAllPrerequisiteValuesFiled =
    iGet(passwordField, 'value') &&
    iGetProviderFieldValue(
      state,
      wizardReduxID,
      provider,
      OvirtProviderField.API_URL,
      VMWareProviderField.HOSTNAME,
    ) &&
    iGetProviderFieldValue(
      state,
      wizardReduxID,
      provider,
      OvirtProviderField.USERNAME,
      VMWareProviderField.USERNAME,
    ) &&
    (!validationField || !isValidationCritical);

  if (provider === VMImportProvider.OVIRT && hasAllPrerequisiteValuesFiled) {
    hasAllPrerequisiteValuesFiled = !!iGetOvirtFieldValue(
      state,
      wizardReduxID,
      OvirtProviderField.CERTIFICATE,
    );
  }

  return {
    passwordField,
    hasAllPrerequisiteValuesFiled: !!hasAllPrerequisiteValuesFiled,
    rememberPassword: !!iGetProviderFieldValue(
      state,
      wizardReduxID,
      provider,
      OvirtProviderField.REMEMBER_PASSWORD,
      VMWareProviderField.REMEMBER_PASSWORD,
    ),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID, provider }) => ({
  onCheckConnection: () =>
    dispatch(
      provider === VMImportProvider.OVIRT
        ? ovirtGetCheckConnectionAction(wizardReduxID)
        : vmwareGetCheckConnectionAction(wizardReduxID),
    ),
  onPasswordChange: (password) =>
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        provider,
        provider === VMImportProvider.OVIRT
          ? OvirtProviderField.PASSWORD
          : VMWareProviderField.PASSWORD,
        { value: password },
      ),
    ),
});

export const VMImportPassword = connect(stateToProps, dispatchToProps)(VMImportPasswordConnected);
