import * as React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import {
  iGetRelevantTemplateSelectors,
  iGetVmSettings,
} from '../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardProps } from '../../types';
import { FormFieldReviewMemoRow } from '../../form/form-field-review-row';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import { getField, getFieldValue, getFlavorValue } from './utils';
import { getOS } from '../../selectors/combined';

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
  } = props;

  const flavorValue = getFlavorValue({
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

  return (
    <dl className={classNames('kubevirt-create-vm-modal__review-tab__data-list', className)}>
      <FormFieldReviewMemoRow field={getField(VMSettingsField.NAME, iVMSettings)} />

      <FormFieldReviewMemoRow field={getField(VMSettingsField.DESCRIPTION, iVMSettings)} />

      {!isImport && (
        <FormFieldReviewMemoRow
          key={VMSettingsField.PROVISION_SOURCE_TYPE}
          field={getField(VMSettingsField.PROVISION_SOURCE_TYPE, iVMSettings)}
        />
      )}

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.OPERATING_SYSTEM, iVMSettings)}
        value={osName}
      />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.FLAVOR, iVMSettings)}
        value={flavorValue}
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
};

const stateToProps = (state, { wizardReduxID }) => ({
  iVMSettings: iGetVmSettings(state, wizardReduxID),
  openshiftFlag: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftFlag),
  iCommonTemplates: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.commonTemplates),
  iUserTemplate: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.userTemplate),
  relevantOptions: iGetRelevantTemplateSelectors(state, wizardReduxID),
  isImport: iGetCommonData(state, wizardReduxID, VMWizardProps.isProviderImport),
});

export const GeneralReview = connect(stateToProps)(GeneralReviewConnected);
