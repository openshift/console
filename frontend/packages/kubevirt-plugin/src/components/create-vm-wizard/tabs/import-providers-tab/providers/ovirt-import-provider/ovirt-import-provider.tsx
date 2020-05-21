import { connect } from 'react-redux';
import * as React from 'react';
import { Checkbox, TextInput } from '@patternfly/react-core';
import {
  iGetOvirtData,
  isOvirtProvider,
} from '../../../../selectors/immutable/provider/ovirt/selectors';
import {
  VMImportProvider,
  OvirtProviderField,
  OvirtProviderRenderableField,
} from '../../../../types';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { iGet } from '../../../../../../utils/immutable';
import { VMImportProviderControllerStatusRow } from '../vm-import-provider-controller-status-row';
import { VMImportProviderControllerErrors } from '../vm-import-provider-controller-errors';
import { VMImportSecrets } from '../vm-import-secrets';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { FormFieldMemoRow } from '../../../../form/form-field-row';
import { getFieldId } from '../../../../utils/renderable-field-utils';
import { VMImportPassword } from '../vm-import-password';
import { VMImportProviderObjectStatus } from '../vm-import-provider-object-status';
import { OvirtProviderClustersVMs } from './ovirt-provider-clusters-vms';
import { OvirtCertificate } from './ovirt-certificate';

import './ovirt-import-provider.scss';

const provider = VMImportProvider.OVIRT;

const OvirtImportProviderConnected: React.FC<OvirtImportProviderProps> = ({
  wizardReduxID,
  isOvirt,
  ovirtData,
  onFieldChange,
}) => {
  const getField = React.useCallback((key: OvirtProviderRenderableField) => iGet(ovirtData, key), [
    ovirtData,
  ]);
  const onChange = React.useCallback(
    (key: OvirtProviderRenderableField) => (value) => onFieldChange(key, { value }),
    [onFieldChange],
  );

  if (!isOvirt) {
    return null;
  }

  return (
    <>
      <VMImportSecrets wizardReduxID={wizardReduxID} provider={provider} />
      <FormFieldMemoRow
        field={getField(OvirtProviderField.API_URL)}
        fieldType={FormFieldType.TEXT}
        fieldHelp={
          <a
            href="https://ovirt.github.io/ovirt-engine-api-model/master/#_access_api_entry_point"
            target="_blank"
            rel="noopener noreferrer"
          >
            API entry point
          </a>
        }
      >
        <FormField>
          <TextInput onChange={onChange(OvirtProviderField.API_URL)} />
        </FormField>
      </FormFieldMemoRow>
      <OvirtCertificate wizardReduxID={wizardReduxID} />
      <FormFieldMemoRow
        field={getField(OvirtProviderField.USERNAME)}
        fieldType={FormFieldType.TEXT}
      >
        <FormField>
          <TextInput onChange={onChange(OvirtProviderField.USERNAME)} />
        </FormField>
      </FormFieldMemoRow>
      <VMImportPassword wizardReduxID={wizardReduxID} provider={provider} />
      <FormFieldMemoRow
        field={getField(OvirtProviderField.REMEMBER_PASSWORD)}
        fieldType={FormFieldType.INLINE_CHECKBOX}
      >
        <FormField>
          <Checkbox
            id={getFieldId(OvirtProviderField.REMEMBER_PASSWORD)}
            onChange={onChange(OvirtProviderField.REMEMBER_PASSWORD)}
            className="kubevirt-create-vm-modal__ovirt-provider-remember-password"
          />
        </FormField>
      </FormFieldMemoRow>
      <OvirtProviderClustersVMs wizardReduxID={wizardReduxID} />
      <VMImportProviderControllerErrors wizardReduxID={wizardReduxID} provider={provider} />
      <VMImportProviderControllerStatusRow
        wizardReduxID={wizardReduxID}
        provider={provider}
        id="vm-import-controller-status"
      />
      <VMImportProviderObjectStatus wizardReduxID={wizardReduxID} provider={provider} />
    </>
  );
};

type OvirtImportProviderProps = {
  isOvirt: boolean;
  ovirtData: any;
  wizardReduxID: string;
  onFieldChange: (key: OvirtProviderField, value: any) => void;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isOvirt: isOvirtProvider(state, wizardReduxID),
  ovirtData: iGetOvirtData(state, wizardReduxID),
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onFieldChange: (key: OvirtProviderField, value: any) =>
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.OVIRT,
        key,
        value,
      ),
    ),
});

export const OvirtImportProvider = connect(
  stateToProps,
  dispatchToProps,
)(OvirtImportProviderConnected);
