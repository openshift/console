import * as React from 'react';
import { connect } from 'react-redux';
import { VMWizardStorage } from '../../types';
import { getStorages } from '../../selectors/selectors';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { VolumeType } from '../../../../constants/vm/storage';
import { getBooleanAsEnabledValue } from '../../../../utils/strings';

import './review-tab.scss';

const AdvancedReviewConnected: React.FC<AdvancedReviewConnectedProps> = (props) => {
  const { storages } = props;

  const cloudInitEnabledValue = getBooleanAsEnabledValue(
    storages.filter(
      (storage) => new VolumeWrapper(storage.volume).getType() === VolumeType.CLOUD_INIT_NO_CLOUD,
    ).length > 0,
  );

  return (
    <dl className="kubevirt-create-vm-modal__review-tab__data-list">
      <dt>Cloud Init</dt>
      <dd>{cloudInitEnabledValue}</dd>
    </dl>
  );
};

type AdvancedReviewConnectedProps = {
  storages: VMWizardStorage[];
};

const stateToProps = (state, { wizardReduxID }) => ({
  storages: getStorages(state, wizardReduxID),
});

export const AdvancedReviewTab = connect(stateToProps)(AdvancedReviewConnected);
