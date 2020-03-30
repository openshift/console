import * as React from 'react';
import { connect } from 'react-redux';
import { isStepHidden, isStepValid } from '../selectors/immutable/wizard-selectors';
import { VMWizardTab } from '../types';

const ValidTabGuardComponent: React.FC<ValidTabGuardComponentProps> = ({
  isHidden,
  isValid,
  children,
}) => {
  return isHidden || !isValid ? null : <>{children}</>;
};

const stateToProps = (state, { wizardReduxID, tabID }) => ({
  isHidden: isStepHidden(state, wizardReduxID, tabID),
  isValid: isStepValid(state, wizardReduxID, tabID),
});

type ValidTabGuardComponentProps = {
  isHidden: boolean;
  isValid: boolean;
  wizardReduxID: string;
  tabID: VMWizardTab;
};

export const ValidTabGuard = connect(stateToProps)(ValidTabGuardComponent);
