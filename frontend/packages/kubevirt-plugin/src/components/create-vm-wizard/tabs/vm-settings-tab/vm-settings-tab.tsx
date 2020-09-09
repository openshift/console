import * as React from 'react';
import { Form, TextArea, TextInput } from '@patternfly/react-core';
import { connect } from 'react-redux';
import { iGet, iGetIn } from '../../../../utils/immutable';
import { FormFieldMemoRow } from '../../form/form-field-row';
import { FormField, FormFieldType } from '../../form/form-field';
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
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { getStepsMetadata } from '../../selectors/immutable/wizard-selectors';
import { iGetProvisionSourceStorage } from '../../selectors/immutable/storage';
import { WorkloadProfile } from './workload-profile';
import { OS } from './os';
import { Flavor } from './flavor';
import { MemoryCPU } from './memory-cpu';
import { ContainerSource } from './container-source';
import { ProvisionSourceComponent } from './provision-source';
import { URLSource } from './url-source';

import '../../create-vm-wizard-footer.scss';
import './vm-settings-tab.scss';

export const VMSettingsTabComponent: React.FC<VMSettingsTabComponentProps> = ({
  userTemplates,
  commonTemplates,
  cnvBaseImages,
  provisionSourceStorage,
  updateStorage,
  openshiftFlag,
  steps,
  goToStep,
  vmSettings,
  onFieldChange,
}) => {
  const getField = React.useCallback((key: VMSettingsField) => iGet(vmSettings, key), [vmSettings]);
  const getFieldValue = React.useCallback(
    (key: VMSettingsField) => iGetIn(vmSettings, [key, 'value']),
    [vmSettings],
  );
  const onChange = React.useCallback(
    (key: VMSettingsRenderableField) => (value) => onFieldChange(key, value),
    [onFieldChange],
  );

  const goToStorageStep = React.useCallback(() => goToStep(VMWizardTab.STORAGE), [goToStep]);
  const goToNetworkingStep = React.useCallback(() => goToStep(VMWizardTab.NETWORKING), [goToStep]);

  return (
    <Form className="co-m-pane__body co-m-pane__form kubevirt-create-vm-modal__form">
      <FormFieldMemoRow field={getField(VMSettingsField.NAME)} fieldType={FormFieldType.TEXT}>
        <FormField>
          <TextInput onChange={onChange(VMSettingsField.NAME)} />
        </FormField>
      </FormFieldMemoRow>
      <FormFieldMemoRow
        field={getField(VMSettingsField.DESCRIPTION)}
        fieldType={FormFieldType.TEXT_AREA}
      >
        <FormField>
          <TextArea
            onChange={onChange(VMSettingsField.DESCRIPTION)}
            className="kubevirt-create-vm-modal__description"
          />
        </FormField>
      </FormFieldMemoRow>
      <OS
        userTemplates={userTemplates}
        commonTemplates={commonTemplates}
        operatinSystemField={getField(VMSettingsField.OPERATING_SYSTEM)}
        flavor={getFieldValue(VMSettingsField.FLAVOR)}
        cloneBaseDiskImageField={getField(VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE)}
        mountWindowsGuestToolsField={getField(VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS)}
        userTemplate={getFieldValue(VMSettingsField.USER_TEMPLATE)}
        workloadProfile={getFieldValue(VMSettingsField.WORKLOAD_PROFILE)}
        cnvBaseImages={cnvBaseImages}
        onChange={onFieldChange}
        openshiftFlag={openshiftFlag}
        goToStorageStep={
          steps[VMWizardTab.STORAGE]?.canJumpTo ? () => goToStep(VMWizardTab.STORAGE) : null
        }
      />
      <ProvisionSourceComponent
        provisionSourceField={getField(VMSettingsField.PROVISION_SOURCE_TYPE)}
        onChange={onFieldChange}
        goToStorageStep={steps[VMWizardTab.STORAGE]?.canJumpTo ? goToStorageStep : null}
        goToNetworkingStep={steps[VMWizardTab.NETWORKING]?.canJumpTo ? goToNetworkingStep : null}
      />
      <ContainerSource
        field={getField(VMSettingsField.CONTAINER_IMAGE)}
        onProvisionSourceStorageChange={updateStorage}
        provisionSourceStorage={provisionSourceStorage}
      />
      <URLSource
        field={getField(VMSettingsField.IMAGE_URL)}
        onProvisionSourceStorageChange={updateStorage}
        provisionSourceStorage={provisionSourceStorage}
      />
      <Flavor
        userTemplates={userTemplates}
        commonTemplates={commonTemplates}
        os={getFieldValue(VMSettingsField.OPERATING_SYSTEM)}
        flavorField={getField(VMSettingsField.FLAVOR)}
        userTemplate={getFieldValue(VMSettingsField.USER_TEMPLATE)}
        workloadProfile={getFieldValue(VMSettingsField.WORKLOAD_PROFILE)}
        cnvBaseImages={cnvBaseImages}
        onChange={onFieldChange}
        openshiftFlag={openshiftFlag}
      />
      <MemoryCPU
        memoryField={getField(VMSettingsField.MEMORY)}
        cpuField={getField(VMSettingsField.CPU)}
        onChange={onFieldChange}
      />
      <WorkloadProfile
        userTemplates={userTemplates}
        commonTemplates={commonTemplates}
        workloadProfileField={getField(VMSettingsField.WORKLOAD_PROFILE)}
        userTemplate={getFieldValue(VMSettingsField.USER_TEMPLATE)}
        operatingSystem={getFieldValue(VMSettingsField.OPERATING_SYSTEM)}
        flavor={getFieldValue(VMSettingsField.FLAVOR)}
        cnvBaseImages={cnvBaseImages}
        onChange={onFieldChange}
      />
    </Form>
  );
};

const stateToProps = (state, { wizardReduxID }) => ({
  vmSettings: iGetVmSettings(state, wizardReduxID),
  commonTemplates: iGetCommonData(state, wizardReduxID, VMWizardProps.commonTemplates),
  userTemplates: iGetCommonData(state, wizardReduxID, VMWizardProps.userTemplates),
  cnvBaseImages: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftCNVBaseImages),
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
  userTemplates: any;
  cnvBaseImages: any;
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
