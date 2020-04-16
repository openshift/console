import * as React from 'react';
import { connect } from 'react-redux';
import {
  iGetRelevantTemplateSelectors,
  iGetVmSettings,
} from '../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardProps } from '../../types';
import { FormFieldReviewMemoRow } from '../../form/form-field-review-row';
import { FormFieldType } from '../../form/form-field';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import { getFieldValue } from '../../selectors/vm-settings';
import { iGetRelevantTemplate } from '../../../../selectors/immutable/template/combined';
import { toShallowJS } from '../../../../utils/immutable';
import { VMTemplateWrapper } from '../../../../k8s/wrapper/vm/vm-template-wrapper';
import { CUSTOM_FLAVOR } from '../../../../constants/vm';
import { iGetFieldValue } from '../../selectors/immutable/field';
import { getField } from './utils';
import { VMSettings } from '../../redux/initial-state/types';
import { getOS } from '../../selectors/combined';

import './review-tab.scss';

const GeneralReviewConnected: React.FC<GeneralReviewConnectedProps> = (props) => {
  const { iVMSettings, iUserTemplates, iCommonTemplates, openshiftFlag, relevantOptions } = props;

  const getFlavorValue = () => {
    const flavor = iGetFieldValue(getField(VMSettingsField[VMSettingsField.FLAVOR], iVMSettings));
    let cpuCores, memory;

    if (flavor === CUSTOM_FLAVOR) {
      cpuCores = iGetFieldValue(getField(VMSettingsField.CPU, iVMSettings));
      memory = iGetFieldValue(getField(VMSettingsField.MEMORY, iVMSettings));
    } else {
      const template_ = toShallowJS(
        iGetRelevantTemplate(iUserTemplates, iCommonTemplates, relevantOptions),
      );
      const template = new VMTemplateWrapper(template_, true).init().clearRuntimeMetadata();

      cpuCores = template.getCPU()?.cores;
      memory = template.getMemory();
    }

    return `${flavor}: ${cpuCores} CPU, ${memory}`;
  };

  const osName =
    getOS({
      osID: getFieldValue(iVMSettings.toJS() as VMSettings, VMSettingsField.OPERATING_SYSTEM),
      iUserTemplates,
      openshiftFlag,
      iCommonTemplates,
    })?.osName || '';

  return (
    <dl className="kubevirt-create-vm-modal__review-tab__data-list">
      <FormFieldReviewMemoRow field={getField(VMSettingsField.NAME, iVMSettings)} />

      <FormFieldReviewMemoRow field={getField(VMSettingsField.DESCRIPTION, iVMSettings)} />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.PROVISION_SOURCE_TYPE, iVMSettings)}
      />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.OPERATING_SYSTEM, iVMSettings)}
        value={osName}
      />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.FLAVOR, iVMSettings)}
        value={getFlavorValue()}
      />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.WORKLOAD_PROFILE, iVMSettings)}
        fieldType={FormFieldType.SELECT}
      />
    </dl>
  );
};

type GeneralReviewConnectedProps = {
  iVMSettings: any;
  openshiftFlag: boolean;
  iCommonTemplates: any;
  iUserTemplates: any;
  relevantOptions: any;
};

const stateToProps = (state, { wizardReduxID }) => ({
  iVMSettings: iGetVmSettings(state, wizardReduxID),
  openshiftFlag: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftFlag),
  iCommonTemplates: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.commonTemplates),
  iUserTemplates: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.userTemplates),
  relevantOptions: iGetRelevantTemplateSelectors(state, wizardReduxID),
});

export const GeneralReview = connect(stateToProps)(GeneralReviewConnected);
