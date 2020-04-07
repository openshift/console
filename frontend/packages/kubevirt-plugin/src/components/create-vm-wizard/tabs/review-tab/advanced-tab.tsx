import * as React from 'react';
import { connect } from 'react-redux';
import { Grid, GridItem } from '@patternfly/react-core';
import { iGetVmSettings } from '../../selectors/immutable/vm-settings';
import { FormFieldReviewMemoRow } from '../../form/form-field-review-row';
import { VMSettingsField } from '../../types';
import { getField } from './utils';
import { FormFieldType } from '../../form/form-field';

const AdvancedReviewConnected: React.FC<AdvancedReviewConnectedProps> = (props) => {
  const { vmSettings } = props;

  // TODO Fill with actual values
  return (
    <Grid>
      <GridItem span={2}>
        {' '}
        <FormFieldReviewMemoRow
          key={VMSettingsField.PROVISION_SOURCE_TYPE}
          field={getField(VMSettingsField.PROVISION_SOURCE_TYPE, vmSettings)}
          fieldType={FormFieldType.SELECT}
        />
      </GridItem>
    </Grid>
  );
};

type AdvancedReviewConnectedProps = {
  vmSettings: any;
};

const stateToProps = (state, { wizardReduxID }) => ({
  vmSettings: iGetVmSettings(state, wizardReduxID),
});

export const AdvancedReviewTab = connect(stateToProps)(AdvancedReviewConnected);
