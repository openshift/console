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
import { Prompt } from 'react-router';
import { useShowErrorToggler } from '../../hooks/use-show-error-toggler';
import { getDialogUIError, getSimpleDialogUIError } from '../../utils/strings';
import { ALL_VM_WIZARD_TABS, VMWizardProps, VMWizardTab } from './types';
import {
  getStepError,
  hasStepAllRequiredFilled,
  isLastStepErrorFatal,
  isStepLocked,
  isStepValid,
  isWizardEmpty,
} from './selectors/immutable/wizard-selectors';
import { iGetCommonData, iGetCreateVMWizardTabs } from './selectors/immutable/selectors';
import {
  getCreateVMLikeEntityLabel,
  REVIEW_AND_CREATE,
  WIZARD_CLOSE_PROMPT,
} from './strings/strings';

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
  isProviderImport: boolean;
};

const CreateVMWizardFooterComponent: React.FC<CreateVMWizardFooterComponentProps> = ({
  stepData,
  isCreateTemplate,
  isProviderImport,
}) => {
  const [showError, setShowError, checkValidity] = useShowErrorToggler();
  return (
    <WizardContextConsumer>
      {({ onNext, onBack, onClose, activeStep, goToStepById }: WizardContext) => {
        const activeStepID = activeStep.id as VMWizardTab;
        const isLocked = _.some(ALL_VM_WIZARD_TABS, (id) => isStepLocked(stepData, id));
        const isValid = isStepValid(stepData, activeStepID);
        const hasStepAllRequired = hasStepAllRequiredFilled(stepData, activeStepID);
        const isLastErrorFatal = isLastStepErrorFatal(stepData);
        const isLastStepValid = isStepValid(stepData, VMWizardTab.RESULT);
        const stepError = getStepError(stepData, activeStepID);
        checkValidity(isValid);

        const isFirstStep = activeStepID === VMWizardTab.VM_SETTINGS;
        const isFinishingStep = [VMWizardTab.REVIEW, VMWizardTab.RESULT].includes(activeStepID);
        const isLastStep = activeStepID === VMWizardTab.RESULT;

        const isNextButtonDisabled = isLocked;
        const isReviewButtonDisabled = isLocked;

        const hideBackButton = activeStep.hideBackButton || (isLastStep && isLastStepValid);
        const isBackButtonDisabled = isFirstStep || isLocked || isLastErrorFatal;

        return (
          <footer className={css(styles.wizardFooter)}>
            <Prompt
              message={(location) => {
                if (location.pathname.endsWith('/~new-wizard')) {
                  return false; // do not allow routing inside the wizard (used mainly by sorting)
                }
                if (isLastStep || isWizardEmpty(stepData, isProviderImport)) {
                  return true;
                }
                return WIZARD_CLOSE_PROMPT;
              }}
            />
            {!isValid && showError && (
              <Alert
                title={
                  stepError
                    ? getSimpleDialogUIError(hasStepAllRequired)
                    : getDialogUIError(hasStepAllRequired)
                }
                isInline
                variant="danger"
                className="kubevirt-create-vm-modal__footer-error"
              >
                {stepError}
              </Alert>
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
            {!hideBackButton && (
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
              <Button
                variant={ButtonVariant.link}
                onClick={() => {
                  if (
                    isLastStep ||
                    isWizardEmpty(stepData, isProviderImport) ||
                    window.confirm(WIZARD_CLOSE_PROMPT) // eslint-disable-line no-alert
                  ) {
                    onClose();
                  }
                }}
              >
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
  isProviderImport: iGetCommonData(state, wizardReduxID, VMWizardProps.isProviderImport),
});

export const CreateVMWizardFooter = connect(stateToProps)(CreateVMWizardFooterComponent);
