import classNames from 'classnames';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { toShallowJS } from '../../../../utils/immutable';
import { FormFieldReviewMemoRow } from '../../form/form-field-review-row';
import { getOS } from '../../selectors/combined';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import { iGetProvisionSourceStorage } from '../../selectors/immutable/storage';
import {
  iGetRelevantTemplateSelectors,
  iGetVmSettings,
} from '../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardProps, VMWizardStorage } from '../../types';
import { getField, getFieldValue, getVMFlavorData } from './utils';

import './review-tab.scss';

const GeneralReviewConnected: React.FC<GeneralReviewConnectedProps> = (props) => {
  const {
    iVMSettings,
    iUserTemplate,
    iCommonTemplates,
    openshiftFlag,
    relevantOptions,
    isImport,
    className,
    provisionSourceStorage,
  } = props;

  const { t } = useTranslation();

  const flavorData = getVMFlavorData({
    iVMSettings,
    iUserTemplate,
    iCommonTemplates,
    relevantOptions,
  });

  const osName =
    getOS({
      osID: getFieldValue(iVMSettings, VMSettingsField.OPERATING_SYSTEM),
      iUserTemplate,
      openshiftFlag,
      iCommonTemplates,
    })?.osName || getField(VMSettingsField.OPERATING_SYSTEM, iVMSettings)?.get('display');

  const storage: VMWizardStorage = toShallowJS(provisionSourceStorage);
  const dataVolumeWrapper = new DataVolumeWrapper(storage?.dataVolume);
  const url = dataVolumeWrapper.getURL();

  return (
    <dl className={classNames('kubevirt-create-vm-modal__review-tab__data-list', className)}>
      <FormFieldReviewMemoRow field={getField(VMSettingsField.NAME, iVMSettings)} />

      <FormFieldReviewMemoRow field={getField(VMSettingsField.DESCRIPTION, iVMSettings)} />

      {!isImport && (
        <FormFieldReviewMemoRow
          key={VMSettingsField.PROVISION_SOURCE_TYPE}
          field={getField(VMSettingsField.PROVISION_SOURCE_TYPE, iVMSettings)}
          value={url && t('kubevirt-plugin~URL: {{url}}', { url })}
        />
      )}

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.OPERATING_SYSTEM, iVMSettings)}
        value={osName}
      />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.FLAVOR, iVMSettings)}
        value={t('kubevirt-plugin~{{flavor}}: {{count}} CPU | {{memory}} Memory', flavorData)}
      />

      <FormFieldReviewMemoRow field={getField(VMSettingsField.WORKLOAD_PROFILE, iVMSettings)} />
    </dl>
  );
};

type GeneralReviewConnectedProps = {
  iVMSettings: any;
  openshiftFlag: boolean;
  iCommonTemplates: any;
  iUserTemplate: any;
  relevantOptions: any;
  isImport: boolean;
  className: string;
  provisionSourceStorage: any;
};

const stateToProps = (state, { wizardReduxID }) => ({
  iVMSettings: iGetVmSettings(state, wizardReduxID),
  openshiftFlag: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftFlag),
  iCommonTemplates: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.commonTemplates),
  iUserTemplate: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.userTemplate),
  relevantOptions: iGetRelevantTemplateSelectors(state, wizardReduxID),
  isImport: iGetCommonData(state, wizardReduxID, VMWizardProps.isProviderImport),
  provisionSourceStorage: iGetProvisionSourceStorage(state, wizardReduxID),
});

export const GeneralReview = connect(stateToProps)(GeneralReviewConnected);
