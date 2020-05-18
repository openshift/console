import * as React from 'react';
import { connect } from 'react-redux';
import { VMWizardTab } from '../../types';
import { isStepPending, isStepValid } from '../../selectors/immutable/wizard-selectors';
import { PendingResults } from './pending-results';
import { SuccessResults } from './success-results';
import { ErrorResults } from './error-results';
import { RequestResultsPart } from './request-results-part';

import './result-tab.scss';

const ResultTabComponent: React.FC<ResultTabComponentProps> = ({
  wizardReduxID,
  isValid,
  isPending,
}) => {
  let content;
  if (isPending) {
    content = <PendingResults key="pending" wizardReduxID={wizardReduxID} />;
  } else if (isValid) {
    content = (
      <>
        <SuccessResults
          key="success"
          className="kubevirt-create-vm-modal___result-tab-spacing"
          wizardReduxID={wizardReduxID}
        />
        <RequestResultsPart wizardReduxID={wizardReduxID} />
      </>
    );
  } else {
    content = (
      <>
        <ErrorResults
          key="error"
          className="kubevirt-create-vm-modal___result-tab-spacing"
          wizardReduxID={wizardReduxID}
        />
        <RequestResultsPart wizardReduxID={wizardReduxID} />
      </>
    );
  }

  return (
    <div className="kubevirt-create-vm-modal__result-tab-outer-container">
      <div className="kubevirt-create-vm-modal__result-tab-inner-container">{content}</div>
    </div>
  );
};

type ResultTabComponentProps = {
  isValid: boolean;
  isPending: boolean;
  wizardReduxID: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isValid: isStepValid(state, wizardReduxID, VMWizardTab.RESULT),
  isPending: isStepPending(state, wizardReduxID, VMWizardTab.RESULT),
});

export const ResultTab = connect(stateToProps)(ResultTabComponent);
