import * as React from 'react';
import { Title } from '@patternfly/react-core';
import { VMSettingsTab } from '../vm-settings-tab/vm-settings-tab';

import './review-tab.scss';

export const ReviewTab: React.FC<ReviewTabProps> = ({ wizardReduxID }) => {
  return (
    <>
      <Title headingLevel="h3" size="lg" className="kubevirt-create-vm-modal__review-tab-title">
        Review and confirm your settings
      </Title>
      <VMSettingsTab wizardReduxID={wizardReduxID} isReview />
    </>
  );
};

type ReviewTabProps = {
  wizardReduxID: string;
};
