import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { getName, getUID } from '@console/shared/src';
import {
  iGetCommonData,
  iGetName,
  iGetUID,
  immutableListToShallowMetadataJS,
} from '../../../../selectors/immutable/selectors';
import { VMImportProvider, VMWareProviderField, VMWareProviderProps } from '../../../../types';
import { iGetVMWareField } from '../../../../selectors/immutable/provider/vmware/selectors';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { FormFieldRow } from '../../../../form/form-field-row';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { iGet, iGetLoadedData, toJS } from '../../../../../../utils/immutable';
import { FormSelectPlaceholderOption } from '../../../../../form/form-select-placeholder-option';
import { getPlaceholder } from '../../../../utils/renderable-field-utils';
import { FormFieldReviewContext } from '../../../../form/form-field-review-context';

const CONNECT_TO_NEW_INSTANCE = 'Connect to New Instance';
const CONNECT_TO_NEW_INSTANCE_ID = `30e4f40e-7ce1-4c90-98a1-14ef960b8549-${CONNECT_TO_NEW_INSTANCE}`;

const VMWareSecretsReviewConnected: React.FC<VMWareSecretsReviewConnectedProps> = React.memo(
  ({ secretField, secrets, onSecretChange }) => {
    const onChange = (value) => {
      const isNewInstance = value === CONNECT_TO_NEW_INSTANCE_ID;
      const secret =
        !value || isNewInstance
          ? null
          : toJS(iGetLoadedData(secrets).find((s) => iGetUID(s) === value));
      onSecretChange({
        value,
        secret,
        isNewInstance,
      });
    };

    return (
      <FormFieldRow
        field={secretField}
        fieldType={FormFieldType.SELECT}
        loadingResources={{ secrets }}
      >
        <FormField>
          <FormSelect onChange={onChange}>
            <FormSelectPlaceholderOption
              placeholder={getPlaceholder(VMWareProviderField.VCENTER)}
              isDisabled={!!iGet(secretField, 'value')}
            />
            <FormSelectOption
              key={CONNECT_TO_NEW_INSTANCE_ID}
              value={CONNECT_TO_NEW_INSTANCE_ID}
              label={CONNECT_TO_NEW_INSTANCE}
            />
            {immutableListToShallowMetadataJS(iGetLoadedData(secrets)).map((secret) => {
              const id = getUID(secret);
              return <FormSelectOption key={id} value={id} label={getName(secret)} />;
            })}
          </FormSelect>
        </FormField>
      </FormFieldRow>
    );
  },
);

type VMWareSecretsReviewConnectedProps = {
  secretField: any;
  secrets: any;
  onSecretChange: (secret: { value: string; secret: any; isNewInstance: boolean }) => void;
};

const VMWareSecretsConnected: React.FC<VMWareSecretsConnectedProps> = ({
  secretField,
  ...props
}) => (
  <FormFieldReviewContext.Consumer>
    {({ isReview }: { isReview: boolean }) => (
      <VMWareSecretsReviewConnected
        secretField={
          isReview ? secretField.set('value', iGetName(secretField.get('secret'))) : secretField
        }
        {...props}
      />
    )}
  </FormFieldReviewContext.Consumer>
);

type VMWareSecretsConnectedProps = VMWareSecretsReviewConnectedProps;

const stateToProps = (state, { wizardReduxID }) => {
  return {
    secretField: iGetVMWareField(state, wizardReduxID, VMWareProviderField.VCENTER),
    secrets: iGetCommonData(state, wizardReduxID, VMWareProviderProps.vCenterSecrets),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onSecretChange: (secret) =>
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.VMWARE,
        VMWareProviderField.VCENTER,
        secret,
      ),
    ),
});

export const VMWareSecrets = connect(stateToProps, dispatchToProps)(VMWareSecretsConnected);
