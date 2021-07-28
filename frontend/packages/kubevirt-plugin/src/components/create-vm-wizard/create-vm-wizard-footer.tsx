/* eslint-disable no-underscore-dangle */
import * as React from 'react';
import {
  Alert,
  Button,
  ButtonVariant,
  WizardContextConsumer,
  WizardStep,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import styles from '@patternfly/react-styles/css/components/Wizard/wizard';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { Prompt } from 'react-router';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { useActiveNamespace } from '@console/shared';
import { useShowErrorToggler } from '../../hooks/use-show-error-toggler';
import { getDialogUIError, getSimpleDialogUIError } from '../../utils';
import { iGetIsLoaded, iGetLoadError } from '../../utils/immutable';
import { vmWizardActions } from './redux/actions';
import { ActionType } from './redux/types';
import { iGetCommonData } from './selectors/immutable/selectors';
import {
  getStepsMetadata,
  isLastStepErrorFatal,
  isWizardEmpty as _isWizardEmpty,
} from './selectors/immutable/wizard-selectors';
import { getGoToStep } from './selectors/selectors';
import {
  ALL_VM_WIZARD_TABS,
  VM_WIZARD_DIFFICULT_TABS,
  VMWizardProps,
  VMWizardTab,
  VMWizardTabsMetadata,
} from './types';

import './create-vm-wizard-footer.scss';

type WizardContext = {
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  activeStep: WizardStep;
  goToStepById: (id: number | string) => void;
};
type CreateVMWizardFooterComponentProps = {
  goToStep: VMWizardTab; // go to this step when not null
  isLastTabErrorFatal: boolean;
  isWizardEmpty: boolean;
  steps: VMWizardTabsMetadata;
  isCreateTemplate: boolean;
  isProviderImport: boolean;
  isSimpleView: boolean;
  isInvalidUserTemplate: boolean;
  onEdit: (activeStepID: VMWizardTab) => void;
};

const CreateVMWizardFooterComponent: React.FC<CreateVMWizardFooterComponentProps> = ({
  steps,
  isLastTabErrorFatal,
  isWizardEmpty,
  isCreateTemplate,
  isProviderImport,
  isSimpleView,
  goToStep,
  onEdit,
  isInvalidUserTemplate,
}) => {
  const { t } = useTranslation();
  const [showError, setShowError, checkValidity] = useShowErrorToggler();
  const [activeNS, setActiveNS] = useActiveNamespace();
  const prevNamespaceRef = React.useRef('');
  React.useEffect(() => {
    prevNamespaceRef.current = activeNS;
  }, [activeNS]);

  const prevNS = prevNamespaceRef.current;

  return (
    <WizardContextConsumer>
      {({ onNext, onBack, onClose, activeStep, goToStepById }: WizardContext) => {
        const activeStepID = activeStep.id as VMWizardTab;
        const isAnyStepLocked = ALL_VM_WIZARD_TABS.some((tab) => steps[tab].isLocked);
        const canNavigateEverywhere =
          isSimpleView && isProviderImport && steps[VMWizardTab.IMPORT_PROVIDERS].isValid;
        const areMainTabsHidden = VM_WIZARD_DIFFICULT_TABS.some((tab) => steps[tab].isHidden);
        const isLastStepValid = steps[VMWizardTab.RESULT].isValid;

        const { hasAllRequiredFilled, errorKey, fieldKeys } = steps[activeStepID];
        const isValid =
          activeStepID === VMWizardTab.REVIEW
            ? !ALL_VM_WIZARD_TABS.filter((tab) => tab !== VMWizardTab.RESULT).some(
                (tab) => !steps[tab].isValid,
              )
            : canNavigateEverywhere || steps[activeStepID].isValid;

        checkValidity(isValid);

        // Hack to make changing steps work from redux
        // goToStep should be reset to null by redux to allow the navigation in subsequent state update
        if (goToStep && goToStep !== activeStepID) {
          goToStepById(goToStep);
        }

        // When the user try to change namespace and click cancel on prompt the namespaces does change.
        // This line change it back to the previous namespace.
        if (prevNS && prevNS !== getActiveNamespace()) {
          setActiveNS(prevNS);
        }

        const isFirstStep = isProviderImport
          ? activeStepID === VMWizardTab.IMPORT_PROVIDERS
          : activeStepID === VMWizardTab.VM_SETTINGS;
        const isFinishingStep = [VMWizardTab.REVIEW, VMWizardTab.RESULT].includes(activeStepID);
        const isLastStep = activeStepID === VMWizardTab.RESULT;

        const isNextButtonDisabled = isAnyStepLocked;
        const isReviewButtonDisabled = isAnyStepLocked || isInvalidUserTemplate;
        const isCreateButtonDisabled = isNextButtonDisabled || isInvalidUserTemplate;

        const hideBackButton = activeStep.hideBackButton || (isLastStep && isLastStepValid);
        const isBackButtonDisabled = isFirstStep || isAnyStepLocked || isLastTabErrorFatal;

        return (
          <footer className={css(`${styles.wizardFooter} kv-create-vm-modal__footer`)}>
            <Prompt
              key="prompt"
              message={(location) => {
                if (location.pathname.endsWith('/~new-wizard')) {
                  return false; // do not allow routing inside the wizard (used mainly by sorting)
                }
                if (isLastStep || isWizardEmpty) {
                  return true;
                }
                return t<string>(
                  "kubevirt-plugin~Are you sure you want to navigate away from this form? Any data you've added will be lost.",
                );
              }}
            />
            {!isValid && showError && (
              <Alert
                key="error"
                title={
                  errorKey
                    ? getSimpleDialogUIError(hasAllRequiredFilled, t)
                    : getDialogUIError(hasAllRequiredFilled, t)
                }
                isInline
                variant="danger"
                className="kubevirt-create-vm-modal__footer-error"
              >
                {t(errorKey)}
                {fieldKeys?.length ? ` ${fieldKeys.map(t).join(', ')}` : ''}
              </Alert>
            )}
            {!isLastStep && (
              <Button
                id="create-vm-wizard-submit-btn"
                key="submit"
                variant={ButtonVariant.primary}
                type="submit"
                onClick={() => {
                  setShowError(!isValid);
                  if (isValid) {
                    onNext();
                  }
                }}
                isDisabled={
                  activeStepID === VMWizardTab.REVIEW
                    ? isCreateButtonDisabled
                    : isNextButtonDisabled
                }
              >
                {activeStepID === VMWizardTab.REVIEW
                  ? isProviderImport
                    ? t('kubevirt-plugin~Import')
                    : isCreateTemplate
                    ? t('kubevirt-plugin~Create Virtual Machine template')
                    : t('kubevirt-plugin~Create Virtual Machine')
                  : t('kubevirt-plugin~Next')}
              </Button>
            )}
            {!isFinishingStep && !(isSimpleView && areMainTabsHidden) && (
              <Button
                id="create-vm-wizard-reviewandcreate-btn"
                key="reviewandcreate"
                variant={ButtonVariant.secondary}
                isDisabled={isReviewButtonDisabled}
                onClick={() => {
                  const jumpToStepID = canNavigateEverywhere
                    ? VMWizardTab.REVIEW
                    : (isValid &&
                        !isAnyStepLocked &&
                        ALL_VM_WIZARD_TABS.find(
                          (stepID) => !steps[stepID].isValid || stepID === VMWizardTab.REVIEW,
                        )) ||
                      activeStepID;

                  setShowError(jumpToStepID !== VMWizardTab.REVIEW);
                  if (jumpToStepID !== activeStepID) {
                    goToStepById(jumpToStepID);
                  }
                }}
              >
                {t('kubevirt-plugin~Review and confirm')}
              </Button>
            )}
            {areMainTabsHidden && canNavigateEverywhere && (
              <Button
                id="create-vm-wizard-edit-btn"
                key="edit"
                variant={ButtonVariant.secondary}
                onClick={() => onEdit(activeStepID)}
              >
                {t('kubevirt-plugin~Edit')}
              </Button>
            )}
            {!hideBackButton && (
              <Button
                id="create-vm-wizard-back-btn"
                key="back"
                variant={ButtonVariant.secondary}
                onClick={onBack}
                className={css(isBackButtonDisabled && 'pf-m-disabled')}
                isDisabled={isBackButtonDisabled}
              >
                {t('kubevirt-plugin~Back')}
              </Button>
            )}
            {!activeStep.hideCancelButton && (
              <Button
                id="create-vm-wizard-cancel-btn"
                key="cancel"
                variant={ButtonVariant.link}
                onClick={() => {
                  if (
                    isLastStep ||
                    isWizardEmpty ||
                    // eslint-disable-next-line no-alert
                    window.confirm(
                      t(
                        "kubevirt-plugin~Are you sure you want to navigate away from this form? Any data you've added will be lost.",
                      ),
                    )
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

const stateToProps = (state, { wizardReduxID }) => {
  const iUserTemplate = iGetCommonData(state, wizardReduxID, VMWizardProps.userTemplate);
  const isInvalidUserTemplate = iUserTemplate
    ? !iGetIsLoaded(iUserTemplate) || !!iGetLoadError(iUserTemplate)
    : false;

  return {
    goToStep: getGoToStep(state, wizardReduxID),
    steps: getStepsMetadata(state, wizardReduxID),
    isLastTabErrorFatal: isLastStepErrorFatal(state, wizardReduxID),
    isWizardEmpty: _isWizardEmpty(state, wizardReduxID),
    isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
    isProviderImport: iGetCommonData(state, wizardReduxID, VMWizardProps.isProviderImport),
    isSimpleView: iGetCommonData(state, wizardReduxID, VMWizardProps.isSimpleView),
    isInvalidUserTemplate,
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  //  no callback like this can be passed through the Wizard component
  onEdit: (activeStepID: VMWizardTab) => {
    dispatch(vmWizardActions[ActionType.OpenDifficultTabs](wizardReduxID));
    dispatch(vmWizardActions[ActionType.SetGoToStep](wizardReduxID, activeStepID)); // keep on the same tab
  },
});

export const CreateVMWizardFooter = connect(stateToProps, dispatchToProps, null, {
  areStatePropsEqual: _.isEqual, // should have only simple values max one level deep
})(CreateVMWizardFooterComponent);
