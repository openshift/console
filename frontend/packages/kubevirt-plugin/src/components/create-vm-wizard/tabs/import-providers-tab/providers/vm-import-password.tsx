import * as React from 'react';
import { Button, ButtonVariant, Split, SplitItem, TextInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ValidationErrorType } from '@console/shared';
import { iGet } from '../../../../../utils/immutable';
import { FormField, FormFieldType } from '../../../form/form-field';
import { FormFieldRow } from '../../../form/form-field-row';
import { vmWizardActions } from '../../../redux/actions';
import { getCheckConnectionAction as ovirtGetCheckConnectionAction } from '../../../redux/state-update/providers/ovirt/ovirt-provider-actions';
import { getCheckConnectionAction as vmwareGetCheckConnectionAction } from '../../../redux/state-update/providers/vmware/vmware-provider-actions';
import { ActionType } from '../../../redux/types';
import { isFieldDisabled } from '../../../selectors/immutable/field';
import {
  iGetProviderField,
  iGetProviderFieldAttribute,
  iGetProviderFieldValue,
} from '../../../selectors/immutable/provider/common';
import {
  iGetOvirtFieldAttribute,
  iGetOvirtFieldValue,
} from '../../../selectors/immutable/provider/ovirt/selectors';
import { OvirtProviderField, VMImportProvider, VMWareProviderField } from '../../../types';

const VMImportPasswordConnected: React.FC<VMImportPasswordConnectedProps> = React.memo(
  ({
    provider,
    passwordField,
    rememberPassword,
    onPasswordChange,
    hasAllPrerequisiteValuesFiled,
    onCheckConnection,
  }) => {
    const { t } = useTranslation();
    return (
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
              {rememberPassword ? t('kubevirt-plugin~Check and Save') : t('kubevirt-plugin~Check')}
            </Button>
          </SplitItem>
        </Split>
      </FormFieldRow>
    );
  },
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
    const certificateValidation = iGetOvirtFieldAttribute(
      state,
      wizardReduxID,
      OvirtProviderField.CERTIFICATE,
      'validation',
    );
    const isCertificateValidationCritical = [
      ValidationErrorType.TrivialError,
      ValidationErrorType.Error,
    ].includes(iGet(certificateValidation, 'type'));

    hasAllPrerequisiteValuesFiled =
      !!iGetOvirtFieldValue(state, wizardReduxID, OvirtProviderField.CERTIFICATE) &&
      !isCertificateValidationCritical;
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
