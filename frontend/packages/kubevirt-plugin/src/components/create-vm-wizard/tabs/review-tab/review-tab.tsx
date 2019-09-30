import * as React from 'react';
import { VMSettingsTab } from '../vm-settings-tab/vm-settings-tab';

export const ReviewTab: React.FC<ReviewTabProps> = ({ wizardReduxID }) => {
  return (
    <>
      <h3>Review and confirm your settings</h3>
      <VMSettingsTab wizardReduxID={wizardReduxID} isReview />
    </>
  );
};

type ReviewTabProps = {
  wizardReduxID: string;
};
