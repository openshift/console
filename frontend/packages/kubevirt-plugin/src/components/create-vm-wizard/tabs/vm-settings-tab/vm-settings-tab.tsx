import * as React from 'react';
import { Form, SelectOption, TextArea, TextInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useAccessReview2 } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassModel } from '@console/internal/models';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { TemplateSupport } from '../../../../constants/vm-templates/support';
import { getDefaultStorageClass } from '../../../../selectors/config-map/sc-defaults';
import { iGet, iGetIn } from '../../../../utils/immutable';
import { FormPFSelect } from '../../../form/form-pf-select';
import { FormField, FormFieldType } from '../../form/form-field';
import { FormFieldMemoRow } from '../../form/form-field-row';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { getInitialData, iGetCommonData } from '../../selectors/immutable/selectors';
import { iGetProvisionSourceStorage } from '../../selectors/immutable/storage';
import { iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { getStepsMetadata } from '../../selectors/immutable/wizard-selectors';
import {
  VMSettingsField,
  VMSettingsFieldAttribute,
  VMSettingsRenderableField,
  VMWizardProps,
  VMWizardStorage,
  VMWizardTab,
  VMWizardTabsMetadata,
} from '../../types';
import { getFieldId } from '../../utils/renderable-field-utils';
import { ClonePVCSource } from './clone-pvc-source';
import { ContainerSource } from './container-source';
import { FlavorSelect } from './flavor';
import { MemoryCPU } from './memory-cpu';
import { OS } from './os';
import { ProvisionSourceComponent } from './provision-source';
import { URLSource } from './url-source';
import { WorkloadSelect } from './workload-profile';

import '../../create-vm-wizard-footer.scss';
import './vm-settings-tab.scss';

export const VMSettingsTabComponent: React.FC<VMSettingsTabComponentProps> = ({
  iUserTemplate,
  commonTemplates,
  commonTemplateName,
  cnvBaseImages,
  provisionSourceStorage,
  updateStorage,
  openshiftFlag,
  isCreateTemplate,
  steps,
  goToStep,
  vmSettings,
  onFieldChange,
  onFieldAttributeChange,
}) => {
  const { t } = useTranslation();
  const getField = React.useCallback((key: VMSettingsField) => iGet(vmSettings, key), [vmSettings]);
  const getFieldValue = React.useCallback(
    (key: VMSettingsField) => iGetIn(vmSettings, [key, 'value']),
    [vmSettings],
  );
  const onChange = React.useCallback(
    (key: VMSettingsRenderableField) => (value) => onFieldChange(key, value),
    [onFieldChange],
  );
  const onAttributeChange = React.useCallback(
    (key: VMSettingsFieldAttribute) => (value) => onFieldAttributeChange(key, value),
    [onFieldAttributeChange],
  );

  const goToStorageStep = React.useCallback(() => goToStep(VMWizardTab.STORAGE), [goToStep]);
  const goToNetworkingStep = React.useCallback(() => goToStep(VMWizardTab.NETWORKING), [goToStep]);

  const [scAllowed] = useAccessReview2({
    group: StorageClassModel.apiGroup,
    resource: StorageClassModel.plural,
    verb: 'list',
  });
  const [storageClasses] = useK8sWatchResource<StorageClassResourceKind[]>(
    scAllowed
      ? {
          kind: StorageClassModel.kind,
          isList: true,
          namespaced: false,
        }
      : null,
  );

  const defaultStorageClass =
    scAllowed && (getDefaultStorageClass(storageClasses) || storageClasses?.[0]);

  React.useEffect(() => {
    if (defaultStorageClass) {
      onAttributeChange(VMSettingsField.DEFAULT_STORAGE_CLASS)(defaultStorageClass?.metadata?.name);
    }
  }, [defaultStorageClass, onAttributeChange]);

  return (
    <Form className="co-m-pane__body co-m-pane__form kubevirt-create-vm-modal__form">
      <FormFieldMemoRow field={getField(VMSettingsField.NAME)} fieldType={FormFieldType.TEXT}>
        <FormField>
          <TextInput onChange={onChange(VMSettingsField.NAME)} />
        </FormField>
      </FormFieldMemoRow>
      <FormFieldMemoRow
        field={getField(VMSettingsField.TEMPLATE_PROVIDER)}
        fieldType={FormFieldType.TEXT}
      >
        <FormField>
          <TextInput onChange={onChange(VMSettingsField.TEMPLATE_PROVIDER)} />
        </FormField>
        <div className="pf-c-form__helper-text" aria-live="polite">
          {t('kubevirt-plugin~example: your company name')}
        </div>
      </FormFieldMemoRow>
      <FormFieldMemoRow
        className="kv-create-vm__input-checkbox"
        field={getField(VMSettingsField.TEMPLATE_SUPPORTED)}
        fieldType={FormFieldType.PF_SELECT}
      >
        <FormField>
          <FormPFSelect
            id={getFieldId(VMSettingsField.TEMPLATE_SUPPORTED)}
            onSelect={(e, v) => {
              onChange(VMSettingsField.TEMPLATE_SUPPORTED)(v.toString());
            }}
          >
            {TemplateSupport.getAll().map((templateSupport) => (
              <SelectOption key={templateSupport.getValue()} value={templateSupport.getValue()}>
                {t(templateSupport.toString())}
              </SelectOption>
            ))}
          </FormPFSelect>
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
        iUserTemplate={iUserTemplate}
        commonTemplates={commonTemplates}
        commonTemplateName={commonTemplateName}
        operatinSystemField={getField(VMSettingsField.OPERATING_SYSTEM)}
        isCreateTemplate={isCreateTemplate}
        flavor={getFieldValue(VMSettingsField.FLAVOR)}
        cloneBaseDiskImageField={getField(VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE)}
        mountWindowsGuestToolsField={getField(VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS)}
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
        baseImageName={commonTemplateName}
      />
      <ClonePVCSource
        nsField={getField(VMSettingsField.CLONE_PVC_NS)}
        nameField={getField(VMSettingsField.CLONE_PVC_NAME)}
        provisionSourceStorage={provisionSourceStorage}
        onProvisionSourceStorageChange={updateStorage}
      />
      <FlavorSelect
        iUserTemplate={iUserTemplate}
        commonTemplates={commonTemplates}
        os={getFieldValue(VMSettingsField.OPERATING_SYSTEM)}
        flavorField={getField(VMSettingsField.FLAVOR)}
        workloadProfile={getFieldValue(VMSettingsField.WORKLOAD_PROFILE)}
        onChange={onFieldChange}
        cnvBaseImages={cnvBaseImages}
        openshiftFlag={openshiftFlag}
      />
      <MemoryCPU
        memoryField={getField(VMSettingsField.MEMORY)}
        cpuField={getField(VMSettingsField.CPU)}
        onChange={onFieldChange}
      />
      <WorkloadSelect
        iUserTemplate={iUserTemplate}
        commonTemplates={commonTemplates}
        os={getFieldValue(VMSettingsField.OPERATING_SYSTEM)}
        workloadProfileField={getField(VMSettingsField.WORKLOAD_PROFILE)}
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
  iUserTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.userTemplate),
  commonTemplateName: getInitialData(state, wizardReduxID).commonTemplateName,
  cnvBaseImages: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftCNVBaseImages),
  openshiftFlag: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftFlag),
  isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
  provisionSourceStorage: iGetProvisionSourceStorage(state, wizardReduxID),
  steps: getStepsMetadata(state, wizardReduxID),
});

type VMSettingsTabComponentProps = {
  onFieldChange: (key: VMSettingsRenderableField, value: string) => void;
  onFieldAttributeChange: (key: VMSettingsFieldAttribute, value: string) => void;
  updateStorage: (storage: VMWizardStorage) => void;
  vmSettings: any;
  provisionSourceStorage: VMWizardStorage;
  commonTemplates: any;
  iUserTemplate: any;
  commonTemplateName: string;
  cnvBaseImages: any;
  openshiftFlag: boolean;
  isCreateTemplate: boolean;
  goToStep: (stepID: VMWizardTab) => void;
  steps: VMWizardTabsMetadata;
  wizardReduxID: string;
};

const dispatchToProps = (dispatch, props) => ({
  onFieldChange: (key, value) =>
    dispatch(vmWizardActions[ActionType.SetVmSettingsFieldValue](props.wizardReduxID, key, value)),
  onFieldAttributeChange: (key, value) =>
    dispatch(vmWizardActions[ActionType.SetVmSettingsFieldValue](props.wizardReduxID, key, value)),
  updateStorage: (storage: VMWizardStorage) => {
    dispatch(vmWizardActions[ActionType.UpdateStorage](props.wizardReduxID, storage));
  },
  goToStep: (stepID: VMWizardTab) => {
    dispatch(vmWizardActions[ActionType.SetGoToStep](props.wizardReduxID, stepID));
  },
});

export const VMSettingsTab = connect(stateToProps, dispatchToProps)(VMSettingsTabComponent);
