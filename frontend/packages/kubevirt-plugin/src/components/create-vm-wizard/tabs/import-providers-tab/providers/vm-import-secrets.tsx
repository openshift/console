import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { getName, getUID } from '@console/shared/src';
import {
  iGetCommonData,
  iGetUID,
  immutableListToShallowMetadataJS,
} from '../../../selectors/immutable/selectors';
import {
  OvirtProviderField,
  OvirtProviderProps,
  VMImportProvider,
  VMWareProviderField,
  VMWareProviderProps,
} from '../../../types';
import { vmWizardActions } from '../../../redux/actions';
import { ActionType } from '../../../redux/types';
import { FormFieldRow } from '../../../form/form-field-row';
import { FormField, FormFieldType } from '../../../form/form-field';
import { iGet, iGetLoadedData, toJS } from '../../../../../utils/immutable';
import { FormSelectPlaceholderOption } from '../../../../form/form-select-placeholder-option';
import { getPlaceholder } from '../../../utils/renderable-field-utils';
import { iGetProviderField } from '../../../selectors/immutable/provider/common';

const CONNECT_TO_NEW_INSTANCE = 'Connect to New Instance';
const CONNECT_TO_NEW_INSTANCE_ID = `30e4f40e-7ce1-4c90-98a1-14ef960b8549-${CONNECT_TO_NEW_INSTANCE}`;

const VMImportSecretsConnected: React.FC<VMImportSecretsReviewProps> = React.memo(
  ({ secretField, secrets, onSecretChange, provider }) => {
    const onChange = (value) => {
      const isNewInstance = value === CONNECT_TO_NEW_INSTANCE_ID;
      const secret =
        isNewInstance || !value
          ? null
          : toJS(iGetLoadedData(secrets).find((s) => iGetUID(s) === value));
      onSecretChange({
        value,
        secretName: secret && getName(secret),
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
              placeholder={getPlaceholder(
                provider === VMImportProvider.OVIRT
                  ? OvirtProviderField.OVIRT_ENGINE_SECRET_NAME
                  : VMWareProviderField.VCENTER_SECRET_NAME,
              )}
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

type VMImportSecretsReviewProps = {
  secretField: any;
  secrets: any;
  onSecretChange: (secret: { value: string; secretName: string; isNewInstance: boolean }) => void;
  provider: VMImportProvider;
};

const stateToProps = (state, { wizardReduxID, provider }) => {
  return {
    secretField: iGetProviderField(
      state,
      wizardReduxID,
      provider,
      OvirtProviderField.OVIRT_ENGINE_SECRET_NAME,
      VMWareProviderField.VCENTER_SECRET_NAME,
    ),
    secrets: iGetCommonData(
      state,
      wizardReduxID,
      provider === VMImportProvider.OVIRT
        ? OvirtProviderProps.ovirtEngineSecrets
        : VMWareProviderProps.vCenterSecrets,
    ),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID, provider }) => ({
  onSecretChange: (secret) =>
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        provider,
        provider === VMImportProvider.OVIRT
          ? OvirtProviderField.OVIRT_ENGINE_SECRET_NAME
          : VMWareProviderField.VCENTER_SECRET_NAME,
        secret,
      ),
    ),
});

export const VMImportSecrets = connect(stateToProps, dispatchToProps)(VMImportSecretsConnected);
