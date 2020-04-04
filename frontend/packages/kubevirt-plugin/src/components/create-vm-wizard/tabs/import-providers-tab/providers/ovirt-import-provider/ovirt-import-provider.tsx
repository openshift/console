import { connect } from 'react-redux';
import * as React from 'react';
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
import { iGet, iGetIn } from '../../../../../../utils/immutable';
import { FormFieldReviewContext } from '../../../../form/form-field-review-context';
import { VMImportProviderControllerStatusRow } from '../vm-import-provider-controller-status-row';
import { VMImportProviderControllerErrors } from '../vm-import-provider-controller-errors';
import { VMImportSecrets } from '../vm-import-secrets';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { Checkbox, TextArea, TextInput } from '@patternfly/react-core';
import { FormFieldMemoRow } from '../../../../form/form-field-row';
import { getFieldId } from '../../../../utils/renderable-field-utils';
import { VMImportPassword } from '../vm-import-password';
import { VMImportProviderObjectStatus } from '../vm-import-provider-object-status';
import { OvirtProviderClustersVMs } from './ovirt-provider-clusters-vms';

import './ovirt-import-provider.scss';

const provider = VMImportProvider.OVIRT;

class OvirtImportProviderConnected extends React.Component<OvirtImportProviderProps> {
  // helpers
  getField = (key: OvirtProviderRenderableField) => iGet(this.props.ovirtData, key);

  getValue = (key: OvirtProviderRenderableField) => iGetIn(this.props.ovirtData, [key, 'value']);

  onChange = (key: OvirtProviderRenderableField) => (value) =>
    this.props.onFieldChange(key, { value });

  render() {
    const { wizardReduxID, isOvirt } = this.props;

    if (!isOvirt) {
      return null;
    }

    return (
      <FormFieldReviewContext.Consumer>
        {({ isReview }: { isReview: boolean }) => (
          <>
            {!isReview && (
              <>
                <VMImportSecrets key="secrets" wizardReduxID={wizardReduxID} provider={provider} />
                <FormFieldMemoRow
                  key={OvirtProviderField.API_URL}
                  field={this.getField(OvirtProviderField.API_URL)}
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
                    <TextInput onChange={this.onChange(OvirtProviderField.API_URL)} />
                  </FormField>
                </FormFieldMemoRow>
                <FormFieldMemoRow
                  key={OvirtProviderField.USERNAME}
                  field={this.getField(OvirtProviderField.USERNAME)}
                  fieldType={FormFieldType.TEXT}
                >
                  <FormField>
                    <TextInput onChange={this.onChange(OvirtProviderField.USERNAME)} />
                  </FormField>
                </FormFieldMemoRow>
                <VMImportPassword
                  key="password"
                  wizardReduxID={wizardReduxID}
                  provider={provider}
                />
                <FormFieldMemoRow
                  key={OvirtProviderField.REMEMBER_PASSWORD}
                  field={this.getField(OvirtProviderField.REMEMBER_PASSWORD)}
                  fieldType={FormFieldType.INLINE_CHECKBOX}
                >
                  <FormField>
                    <Checkbox
                      id={getFieldId(OvirtProviderField.REMEMBER_PASSWORD)}
                      onChange={this.onChange(OvirtProviderField.REMEMBER_PASSWORD)}
                      className="kubevirt-create-vm-modal__ovirt-provider-remember-password"
                    />
                  </FormField>
                </FormFieldMemoRow>
                <FormFieldMemoRow
                  key={OvirtProviderField.CERTIFICATE}
                  field={this.getField(OvirtProviderField.CERTIFICATE)}
                  fieldType={FormFieldType.TEXT_AREA}
                  fieldHelp={
                    <a
                      href="https://ovirt.github.io/ovirt-engine-api-model/master/#_obtaining_the_ca_certificate"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Obtaining the CA certificate
                    </a>
                  }
                >
                  <FormField>
                    <TextArea
                      onChange={this.onChange(OvirtProviderField.CERTIFICATE)}
                      className="kubevirt-create-vm-modal__ovirt-provider-ca"
                    />
                  </FormField>
                </FormFieldMemoRow>
                <OvirtProviderClustersVMs key="vms" wizardReduxID={wizardReduxID} />
                <VMImportProviderControllerErrors
                  key="errors"
                  wizardReduxID={wizardReduxID}
                  provider={provider}
                />
                <VMImportProviderControllerStatusRow
                  key="controllerstatus-row"
                  wizardReduxID={wizardReduxID}
                  provider={provider}
                  id="vm-import-controller-status"
                />
                <VMImportProviderObjectStatus
                  key="object-status"
                  wizardReduxID={wizardReduxID}
                  provider={provider}
                />
              </>
            )}
          </>
        )}
      </FormFieldReviewContext.Consumer>
    );
  }
}

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
