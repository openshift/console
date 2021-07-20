import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { getBooleanAsEnabledValue } from '../../../../utils';
import { iGetCloudInitNoCloudStorage } from '../../selectors/immutable/storage';

import './review-tab.scss';

const AdvancedReviewConnected: React.FC<AdvancedReviewConnectedProps> = (props) => {
  const { t } = useTranslation();
  const { cloudInitEnabled } = props;

  const cloudInitEnabledValue = getBooleanAsEnabledValue(cloudInitEnabled);

  return (
    <dl className="kubevirt-create-vm-modal__review-tab__data-list">
      <dt>{t('kubevirt-plugin~Cloud Init')}</dt>
      <dd id="wizard-review-cloud_init">{cloudInitEnabledValue}</dd>
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
