import * as React from 'react';
import { connect } from 'react-redux';
import { Grid } from '@patternfly/react-core';
import { iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardProps } from '../../types';
import { FormFieldReviewMemoRow } from '../../form/form-field-review-row';
import { FormFieldType } from '../../form/form-field';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import { getOS } from '../../selectors/common';
import { getFieldValue } from '../../selectors/vm-settings';
import { getField } from './utils';
import { FlavorReviewRow } from './FlavorRow';
import { VMSettings } from '../../redux/initial-state/types';

import './general-tab.scss';

const GeneralReviewConnected: React.FC<GeneralReviewConnectedProps> = (props) => {
  const { iVMSettings, iUserTemplates, iCommonTemplates, openshiftFlag } = props;

  const osName =
    getOS({
      osID: getFieldValue(iVMSettings.toJS() as VMSettings, VMSettingsField.OPERATING_SYSTEM),
      iUserTemplates,
      openshiftFlag,
      iCommonTemplates,
    })?.osName || '';

  return (
    <Grid className="kubevirt-create-vm-modal__general-tab-container" gutter={'sm'}>
      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.NAME, iVMSettings)}
      />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.DESCRIPTION, iVMSettings)}
      />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.PROVISION_SOURCE_TYPE, iVMSettings)}
      />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.OPERATING_SYSTEM, iVMSettings)}
        value={osName}
      />

      <FlavorReviewRow vmSettings={iVMSettings} />

      <FormFieldReviewMemoRow
        field={getField(VMSettingsField.WORKLOAD_PROFILE, iVMSettings)}
        fieldType={FormFieldType.SELECT}
      />
    </Grid>
  );
};

type GeneralReviewConnectedProps = {
  iVMSettings: any;
  openshiftFlag: boolean;
  iCommonTemplates: any;
  iUserTemplates: any;
};

const stateToProps = (state, { wizardReduxID }) => ({
  iVMSettings: iGetVmSettings(state, wizardReduxID),
  openshiftFlag: iGetCommonData(state, wizardReduxID, VMWizardProps.openshiftFlag),
  iCommonTemplates: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.commonTemplates),
  iUserTemplates: iGetLoadedCommonData(state, wizardReduxID, VMWizardProps.userTemplates),
});

export const GeneralReview = connect(stateToProps)(GeneralReviewConnected);
