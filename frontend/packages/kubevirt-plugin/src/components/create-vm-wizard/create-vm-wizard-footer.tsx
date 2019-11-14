import * as React from 'react';
import { connect } from 'react-redux';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Wizard/wizard';
import {
  Alert,
  Button,
  ButtonVariant,
  WizardContextConsumer,
  WizardStep,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { useShowErrorToggler } from '../../hooks/use-show-error-toggler';
import { getDialogUIError } from '../../utils/strings';
import { ALL_VM_WIZARD_TABS, VMWizardProps, VMWizardTab } from './types';
import {
  hasStepAllRequiredFilled,
  isStepLocked,
  isStepValid,
} from './selectors/immutable/wizard-selectors';
import { iGetCommonData, iGetCreateVMWizardTabs } from './selectors/immutable/selectors';
import { getCreateVMLikeEntityLabel, REVIEW_AND_CREATE } from './strings/strings';

import './create-vm-wizard-footer.scss';

type WizardContext = {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  activeStep: WizardStep;
  goToStepById: (id: number | string) => void;
};
type CreateVMWizardFooterComponentProps = {
  stepData: any;
  isCreateTemplate: boolean;
};

const CreateVMWizardFooterComponent: React.FC<CreateVMWizardFooterComponentProps> = ({
  stepData,
  isCreateTemplate,
}) => {
  const [showError, setShowError, checkValidity] = useShowErrorToggler();
  return (
    <WizardContextConsumer>
      {({ onNext, onBack, onClose, activeStep, goToStepById }: WizardContext) => {
        const activeStepID = activeStep.id as VMWizardTab;
        const isLocked = _.some(ALL_VM_WIZARD_TABS, (id) => isStepLocked(stepData, id));
        const isValid = isStepValid(stepData, activeStepID);
        checkValidity(isValid);

        const isFirstStep = activeStepID === VMWizardTab.VM_SETTINGS;
        const isFinishingStep = [VMWizardTab.REVIEW, VMWizardTab.RESULT].includes(activeStepID);
        const isLastStep = activeStepID === VMWizardTab.RESULT;

        const isNextButtonDisabled = isLocked;
        const isReviewButtonDisabled = isLocked;
        const isBackButtonDisabled = isFirstStep || isLocked;

        return (
          <footer className={css(styles.wizardFooter)}>
            {!isValid && showError && (
              <Alert
                title={getDialogUIError(hasStepAllRequiredFilled(stepData, activeStepID))}
                isInline
                variant="danger"
                className="kubevirt-create-vm-modal__footer-error"
              />
            )}
            {!isLastStep && (
              <Button
                variant={ButtonVariant.primary}
                type="submit"
                onClick={() => {
                  setShowError(!isValid);
                  if (isValid) {
                    onNext();
                  }
                }}
                isDisabled={isNextButtonDisabled}
              >
                {activeStepID === VMWizardTab.REVIEW
                  ? getCreateVMLikeEntityLabel(isCreateTemplate)
                  : 'Next'}
              </Button>
            )}
            {!isFinishingStep && (
              <Button
                variant={ButtonVariant.secondary}
                isDisabled={isReviewButtonDisabled}
                onClick={() => {
                  const jumpToStepID =
                    (isValid &&
                      !isLocked &&
                      ALL_VM_WIZARD_TABS.find(
                        (stepID) => !isStepValid(stepData, stepID) || stepID === VMWizardTab.REVIEW,
                      )) ||
                    activeStepID;

                  setShowError(jumpToStepID !== VMWizardTab.REVIEW);
                  if (jumpToStepID !== activeStepID) {
                    goToStepById(jumpToStepID);
                  }
                }}
              >
                {REVIEW_AND_CREATE}
              </Button>
            )}
            {!activeStep.hideBackButton && !isLastStep && (
              <Button
                variant={ButtonVariant.secondary}
                onClick={onBack}
                className={css(isBackButtonDisabled && 'pf-m-disabled')}
                isDisabled={isBackButtonDisabled}
              >
                Back
              </Button>
            )}
            {!activeStep.hideCancelButton && (
              <Button variant={ButtonVariant.link} onClick={() => onClose()}>
                Cancel
              </Button>
            )}
          </footer>
        );
      }}
    </WizardContextConsumer>
  );
};

const stateToProps = (state, { wizardReduxID }) => ({
  stepData: iGetCreateVMWizardTabs(state, wizardReduxID),
  isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
});

export const CreateVMWizardFooter = connect(stateToProps)(CreateVMWizardFooterComponent);
