import * as React from 'react';
import { Title } from '@patternfly/react-core';
import { VMSettingsTab } from '../vm-settings-tab/vm-settings-tab';
import { NetworkingReview } from './networking-review';

import './review-tab.scss';

export const ReviewTab: React.FC<ReviewTabProps> = ({ wizardReduxID }) => {
  return (
    <>
      <Title headingLevel="h3" size="lg" className="kubevirt-create-vm-modal__review-tab-title">
        Review and confirm your settings
      </Title>
      <VMSettingsTab wizardReduxID={wizardReduxID} isReview />
      <NetworkingReview
        wizardReduxID={wizardReduxID}
        className="kubevirt-create-vm-modal__review-tab-lower-section"
      />
    </>
  );
};

type ReviewTabProps = {
  wizardReduxID: string;
};
