import * as React from 'react';
import { FormSelect, FormSelectOption } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { iGet, iGetIn, immutableListToShallowJS } from '../../../../utils/immutable';
import { FormFieldMemoRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { vmWizardActions } from '../../redux/actions';
import { ImportProviderRenderableField, ImportProvidersField, VMImportProvider } from '../../types';
import { ActionType } from '../../redux/types';
import { getPlaceholder } from '../../utils/renderable-field-utils';
import { FormFieldForm } from '../../form/form-field-form';
import { VMWareImportProvider } from './providers/vmware-import-provider/vmware-import-provider';
import { iGetImportProviders } from '../../selectors/immutable/import-providers';
import { OvirtImportProvider } from './providers/ovirt-import-provider/ovirt-import-provider';

class ImportProvidersTabComponent extends React.Component<ImportProvidersTabComponentProps> {
  getField = (key: ImportProvidersField) => iGet(this.props.importProviders, key);

  getFieldAttribute = (key: ImportProvidersField, attribute: string) =>
    iGetIn(this.props.importProviders, [key, attribute]);

  getFieldValue = (key: ImportProvidersField) => iGetIn(this.props.importProviders, [key, 'value']);

  onChange = (key: ImportProviderRenderableField) => (value) =>
    this.props.onFieldChange(key, value);

  render() {
    const { isReview, wizardReduxID } = this.props;

    return (
      <FormFieldForm isReview={isReview}>
        <FormFieldMemoRow
          key={ImportProvidersField.PROVIDER}
          field={this.getField(ImportProvidersField.PROVIDER)}
          fieldType={FormFieldType.SELECT}
        >
          <FormField>
            <FormSelect onChange={this.onChange(ImportProvidersField.PROVIDER)}>
              <FormSelectPlaceholderOption
                placeholder={getPlaceholder(ImportProvidersField.PROVIDER)}
                isDisabled={!!this.getFieldValue(ImportProvidersField.PROVIDER)}
              />
              {immutableListToShallowJS(
                this.getFieldAttribute(ImportProvidersField.PROVIDER, 'providers'),
              ).map(({ id, name }) => (
                <FormSelectOption key={id} value={id} label={name} />
              ))}
            </FormSelect>
          </FormField>
        </FormFieldMemoRow>
        <OvirtImportProvider key={VMImportProvider.OVIRT} wizardReduxID={wizardReduxID} />
        <VMWareImportProvider key={VMImportProvider.VMWARE} wizardReduxID={wizardReduxID} />
      </FormFieldForm>
    );
  }
}

const stateToProps = (state, { wizardReduxID }) => ({
  importProviders: iGetImportProviders(state, wizardReduxID),
});

type ImportProvidersTabComponentProps = {
  onFieldChange: (key: ImportProviderRenderableField, value: string) => void;
  importProviders: any;
  isReview: boolean;
  wizardReduxID: string;
};

const dispatchToProps = (dispatch, props) => ({
  onFieldChange: (key, value) =>
    dispatch(
      vmWizardActions[ActionType.SetImportProvidersFieldValue](props.wizardReduxID, key, value),
    ),
});

export const ImportProvidersTab = connect(
  stateToProps,
  dispatchToProps,
)(ImportProvidersTabComponent);
