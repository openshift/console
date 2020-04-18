import * as React from 'react';
import { connect } from 'react-redux';
import { getBooleanAsEnabledValue } from '../../../../utils/strings';
import { iGetCloudInitNoCloudStorage } from '../../selectors/immutable/storage';

import './review-tab.scss';

const AdvancedReviewConnected: React.FC<AdvancedReviewConnectedProps> = (props) => {
  const { cloudInitEnabled } = props;

  const cloudInitEnabledValue = getBooleanAsEnabledValue(cloudInitEnabled);

  return (
    <dl className="kubevirt-create-vm-modal__review-tab__data-list">
      <dt>Cloud Init</dt>
      <dd>{cloudInitEnabledValue}</dd>
    </dl>
  );
};

type AdvancedReviewConnectedProps = {
  cloudInitEnabled: boolean;
};

const stateToProps = (state, { wizardReduxID }) => ({
  cloudInitEnabled: !!iGetCloudInitNoCloudStorage(state, wizardReduxID),
});

export const AdvancedReviewTab = connect(stateToProps)(AdvancedReviewConnected);
