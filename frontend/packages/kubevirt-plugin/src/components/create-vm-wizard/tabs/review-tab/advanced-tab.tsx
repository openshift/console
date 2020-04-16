import * as React from 'react';
import { connect } from 'react-redux';
import { Grid, GridItem, Title } from '@patternfly/react-core';
import { VMWizardStorage } from '../../types';
import { getStorages } from '../../selectors/selectors';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { VolumeType } from '../../../../constants/vm/storage';
import {getBooleanAsEnabledValue} from '../../../../utils/strings';

import './review-tab.scss';

const AdvancedReviewConnected: React.FC<AdvancedReviewConnectedProps> = (props) => {
  const { storages } = props;

  const cloudInitEnabledValue = getBooleanAsEnabledValue(
    storages.filter(
      (storage) => new VolumeWrapper(storage.volume).getType() === VolumeType.CLOUD_INIT_NO_CLOUD,
    ).length > 0,
  );

  return (
    <Grid className="kubevirt-create-vm-modal__review-tab-section-container">
      <GridItem span={1}>
        <Title headingLevel="h4" size="sm">
          Cloud Init
        </Title>
      </GridItem>
      <GridItem span={11}>{cloudInitEnabledValue}</GridItem>
    </Grid>
  );
};

type AdvancedReviewConnectedProps = {
  storages: VMWizardStorage[];
  // vmSettings: any;
};

const stateToProps = (state, { wizardReduxID }) => ({
  storages: getStorages(state, wizardReduxID),
  // vmSettings: iGetVmSettings(state, wizardReduxID),
});

export const AdvancedReviewTab = connect(stateToProps)(AdvancedReviewConnected);
