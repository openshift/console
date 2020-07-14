import * as React from 'react';
import { Form, FormSelect, FormSelectOption, TextArea, TextInput } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { iGet, iGetIn } from '../../../../utils/immutable';
import { FormFieldMemoRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormSelectPlaceholderOption } from '../../../form/form-select-placeholder-option';
import { vmWizardActions } from '../../redux/actions';
import {
  VMSettingsField,
  VMSettingsRenderableField,
  VMWizardProps,
  VMWizardStorage,
  VMWizardTab,
  VMWizardTabsMetadata,
} from '../../types';
import { iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { ActionType } from '../../redux/types';
import { getPlaceholder } from '../../utils/renderable-field-utils';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { iGetProvisionSourceStorage } from '../../selectors/immutable/storage';
import { WorkloadProfile } from './workload-profile';
import { OSFlavor } from './os-flavor';
import { UserTemplates } from './user-templates';
import { MemoryCPU } from './memory-cpu';
import { ContainerSource } from './container-source';
import { URLSource } from './url-source';

import '../../create-vm-wizard-footer.scss';
import './vm-settings-tab.scss';
import { getStepsMetadata } from '../../selectors/immutable/wizard-selectors';

export class VMSettingsTabComponent extends React.Component<VMSettingsTabComponentProps> {
  getField = (key: VMSettingsField) => iGet(this.props.vmSettings, key);

  getFieldAttribute = (key: VMSettingsField, attribute: string) =>
    iGetIn(this.props.vmSettings, [key, attribute]);

  getFieldValue = (key: VMSettingsField) => iGetIn(this.props.vmSettings, [key, 'value']);

  onChange = (key: VMSettingsRenderableField) => (value) => this.props.onFieldChange(key, value);

  render() {
    const {
      userTemplateName,
      userTemplates,
      commonTemplates,
      commonDataVolumes,
      provisionSourceStorage,
      updateStorage,
      openshiftFlag,
      steps,
      goToStep,
    } = this.props;

    return (
      <Form className="co-m-pane__body co-m-pane__form kubevirt-create-vm-modal__form">
        <FormFieldMemoRow
          field={this.getField(VMSettingsField.NAME)}
          fieldType={FormFieldType.TEXT}
        >
          <FormField>
            <TextInput onChange={this.onChange(VMSettingsField.NAME)} />
          </FormField>
        </FormFieldMemoRow>
        <FormFieldMemoRow
          field={this.getField(VMSettingsField.DESCRIPTION)}
          fieldType={FormFieldType.TEXT_AREA}
        >
          <FormField>
            <TextArea
              onChange={this.onChange(VMSettingsField.DESCRIPTION)}
              className="kubevirt-create-vm-modal__description"
            />
          </FormField>
        </FormFieldMemoRow>
        <UserTemplates
          userTemplateField={this.getField(VMSettingsField.USER_TEMPLATE)}
          forceSingleUserTemplateName={userTemplateName}
          userTemplates={userTemplates}
          commonTemplates={commonTemplates}
          openshiftFlag={openshiftFlag}
          onChange={this.props.onFieldChange}
        />
        <OSFlavor
          userTemplates={userTemplates}
          commonTemplates={commonTemplates}
          operatinSystemField={this.getField(VMSettingsField.OPERATING_SYSTEM)}
          flavorField={this.getField(VMSettingsField.FLAVOR)}
          cloneBaseDiskImageField={this.getField(VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE)}
          userTemplate={this.getFieldValue(VMSettingsField.USER_TEMPLATE)}
          workloadProfile={this.getFieldValue(VMSettingsField.WORKLOAD_PROFILE)}
          commonDataVolumes={commonDataVolumes}
          onChange={this.props.onFieldChange}
          openshiftFlag={openshiftFlag}
          goToStep={goToStep}
          steps={steps}
        />
        <MemoryCPU
          memoryField={this.getField(VMSettingsField.MEMORY)}
          cpuField={this.getField(VMSettingsField.CPU)}
          onChange={this.props.onFieldChange}
        />
        <WorkloadProfile
          userTemplates={userTemplates}
          commonTemplates={commonTemplates}
          workloadProfileField={this.getField(VMSettingsField.WORKLOAD_PROFILE)}
          userTemplate={this.getFieldValue(VMSettingsField.USER_TEMPLATE)}
          operatingSystem={this.getFieldValue(VMSettingsField.OPERATING_SYSTEM)}
          flavor={this.getFieldValue(VMSettingsField.FLAVOR)}
          onChange={this.props.onFieldChange}
        />
        <FormFieldMemoRow
          field={this.getField(VMSettingsField.PROVISION_SOURCE_TYPE)}
          fieldType={FormFieldType.SELECT}
        >
          <FormField>
            <FormSelect onChange={this.onChange(VMSettingsField.PROVISION_SOURCE_TYPE)}>
              <FormSelectPlaceholderOption
                placeholder={getPlaceholder(VMSettingsField.PROVISION_SOURCE_TYPE)}
                isDisabled={!!this.getFieldValue(VMSettingsField.PROVISION_SOURCE_TYPE)}
              />
              {(this.getFieldAttribute(VMSettingsField.PROVISION_SOURCE_TYPE, 'sources') || []).map(
                (source) => (
                  <FormSelectOption key={source} value={source} label={source} />
                ),
              )}
            </FormSelect>
          </FormField>
        </FormFieldMemoRow>
        <ContainerSource
          field={this.getField(VMSettingsField.CONTAINER_IMAGE)}
          onProvisionSourceStorageChange={updateStorage}
          provisionSourceStorage={provisionSourceStorage}
        />
        <URLSource
          field={this.getField(VMSettingsField.IMAGE_URL)}
          onProvisionSourceStorageChange={updateStorage}
          provisionSourceStorage={provisionSourceStorage}
        />
      </Form>
    );
  }
}

const stateToProps = (state, { wizardReduxID }) => ({
  vmSettings: iGetVmSettings(state, wizardReduxID),
  commonTemplates: iGetCommonData(state, wizardReduxID, VMWizardProps.commonTemplates),
  userTemplateName: iGetCommonData(state, wizardReduxID, VMWizardProps.userTemplateName),
  userTemplates: iGetCommonData(state, wizardReduxID, VMWizardProps.userTemplates),
  commonDataVolumes: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftCNVBaseImages),
  openshiftFlag: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftFlag),
  provisionSourceStorage: iGetProvisionSourceStorage(state, wizardReduxID),
  steps: getStepsMetadata(state, wizardReduxID),
});

type VMSettingsTabComponentProps = {
  onFieldChange: (key: VMSettingsRenderableField, value: string) => void;
  updateStorage: (storage: VMWizardStorage) => void;
  vmSettings: any;
  provisionSourceStorage: VMWizardStorage;
  commonTemplates: any;
  userTemplateName: string;
  userTemplates: any;
  commonDataVolumes: any;
  openshiftFlag: boolean;
  goToStep: (stepID: VMWizardTab) => void;
  steps: VMWizardTabsMetadata;
  wizardReduxID: string;
};

const dispatchToProps = (dispatch, props) => ({
  onFieldChange: (key, value) =>
    dispatch(vmWizardActions[ActionType.SetVmSettingsFieldValue](props.wizardReduxID, key, value)),
  updateStorage: (storage: VMWizardStorage) => {
    dispatch(vmWizardActions[ActionType.UpdateStorage](props.wizardReduxID, storage));
  },
  goToStep: (stepID: VMWizardTab) => {
    dispatch(vmWizardActions[ActionType.SetGoToStep](props.wizardReduxID, stepID));
  },
});

export const VMSettingsTab = connect(stateToProps, dispatchToProps)(VMSettingsTabComponent);
