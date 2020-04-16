import * as React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import {
  iGetRelevantTemplateSelectors,
  iGetVmSettings,
} from '../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardProps } from '../../types';
import { FormFieldReviewMemoRow } from '../../form/form-field-review-row';
import { FormFieldType } from '../../form/form-field';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import { getFieldValue } from '../../selectors/vm-settings';
import { getField, getFlavorValue } from './utils';
import { VMSettings } from '../../redux/initial-state/types';
import { getOS } from '../../selectors/combined';

import './review-tab.scss';

const GeneralReviewConnected: React.FC<GeneralReviewConnectedProps> = (props) => {
  const { iVMSettings, iUserTemplates, iCommonTemplates, openshiftFlag, relevantOptions, className } = props;

  const flavorValue = getFlavorValue({
    iVMSettings,
    iUserTemplates,
    iCommonTemplates,
    relevantOptions,
  });

  const osName =
    getOS({
      osID: getFieldValue(iVMSettings as VMSettings, VMSettingsField.OPERATING_SYSTEM),
      iUserTemplates,
      openshiftFlag,
      iCommonTemplates,
    })?.osName || '';

  return (
    <dl className={classNames('kubevirt-create-vm-modal__review-tab__data-list', className)}>
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
        value={flavorValue}
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
  className: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  iVMSettings: iGetVmSettings(state, wizardReduxID),
  openshiftFlag: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftFlag),
  iCommonTemplates: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.commonTemplates),
  iUserTemplates: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.userTemplates),
  relevantOptions: iGetRelevantTemplateSelectors(state, wizardReduxID),
});

export const GeneralReview = connect(stateToProps)(GeneralReviewConnected);
