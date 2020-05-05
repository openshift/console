import * as _ from 'lodash';
import { connect } from 'react-redux';
import {
  Alert,
  AlertVariant,
  Breadcrumb,
  BreadcrumbHeading,
  BreadcrumbItem,
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import { VMWizardNetwork, VMWizardProps, VMWizardStorage, VMWizardTab } from '../types';
import { iGetCommonData } from '../selectors/immutable/selectors';
import * as React from 'react';
import { vmWizardActions } from '../redux/actions';
import { ActionType } from '../redux/types';
import { toJS } from '../../../utils/immutable';
import { vmWizardNicModalEnhanced } from '../tabs/networking-tab/vm-wizard-nic-modal-enhanced';
import { Action, Error } from './types';
import { wrapWithProgress } from '../../../utils/utils';
import { vmWizardStorageModalEnhanced } from '../tabs/storage-tab/vm-wizard-storage-modal-enhanced';
import { computeNetworkErrors, computeStorageErrors, computeVMSettingsErrors } from './utils';

import './wizard-errors.scss';

type ErrorsProps = {
  hasAllRequiredFilled?: boolean;
  isValid?: boolean;
  errors: Error[];
  goToStep: (stepID: VMWizardTab) => void;
  setTabLocked: (isLocked: boolean) => void;
};

const Errors: React.FC<ErrorsProps> = ({
  hasAllRequiredFilled,
  isValid,
  errors,
  goToStep,
  setTabLocked,
}) => {
  const onActionResolver = React.useCallback(
    (action: Action) => () => {
      if (action) {
        if (action.goToStep) {
          goToStep(action.goToStep);
        }
        if (action.openModal) {
          const { nicModal, diskModal, showInitialValidation, wizardReduxID } = action.openModal;
          if (nicModal) {
            const { iNIC } = nicModal;

            wrapWithProgress(setTabLocked)(
              vmWizardNicModalEnhanced({
                blocking: true,
                isEditing: true,
                wizardReduxID,
                network: toJS(iNIC) as VMWizardNetwork,
                showInitialValidation,
              }).result,
            );
          } else if (diskModal) {
            const { iStorage } = diskModal;
            const storage = toJS(iStorage) as VMWizardStorage;

            const withProgress = wrapWithProgress(setTabLocked);
            withProgress(
              vmWizardStorageModalEnhanced({
                blocking: true,
                isEditing: true,
                wizardReduxID,
                storage,
                showInitialValidation,
              }).result,
            );
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (isValid || errors.length <= 0) {
    return null;
  }

  return (
    <Alert
      title={hasAllRequiredFilled ? 'Some fields are incorrect' : 'Additional fields required'}
      isInline
      variant={AlertVariant.danger}
      className="kv-create-vm-modal__wizard-errors"
    >
      <p>
        {`The following fields must be ${
          hasAllRequiredFilled ? 'fixed' : 'completed'
        } before importing this virtual machine`}
      </p>
      <ul className="kv-create-vm-modal__wizard-errors-errors-list">
        {errors.map(({ id: errorID, path }) => (
          <li key={errorID}>
            <Breadcrumb className="kv-create-vm-modal__wizard-errors-errors-list-item">
              {path.map(({ id, name, action }, idx) => {
                const component = action ? (
                  <Button isInline onClick={onActionResolver(action)} variant={ButtonVariant.link}>
                    {name}
                  </Button>
                ) : (
                  <>{name}</>
                );
                return idx === path.length - 1 ? (
                  <BreadcrumbHeading key={id}>{component}</BreadcrumbHeading>
                ) : (
                  <BreadcrumbItem key={id}>{component}</BreadcrumbItem>
                );
              })}
            </Breadcrumb>
          </li>
        ))}
      </ul>
    </Alert>
  );
};

const stateToProps = (state, { wizardReduxID }) => {
  const isProviderImport = iGetCommonData(state, wizardReduxID, VMWizardProps.isProviderImport);
  const isSimpleView = iGetCommonData(state, wizardReduxID, VMWizardProps.isSimpleView);

  const resolvers = [];
  if (isProviderImport && isSimpleView) {
    resolvers.push(computeVMSettingsErrors, computeNetworkErrors, computeStorageErrors);
  }

  return resolvers.reduce(
    (result, computeNextErrors) => {
      const { hasAllRequiredFilled, isValid, errors } = computeNextErrors(state, wizardReduxID);
      result.hasAllRequiredFilled = result.hasAllRequiredFilled && hasAllRequiredFilled;
      result.isValid = result.isValid && isValid;
      result.errors.push(...errors);
      return result;
    },
    {
      isValid: true,
      hasAllRequiredFilled: true,
      errors: [],
    },
  );
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  goToStep: (stepID: VMWizardTab) => {
    dispatch(vmWizardActions[ActionType.OpenDifficultTabs](wizardReduxID));
    dispatch(vmWizardActions[ActionType.SetGoToStep](wizardReduxID, stepID));
  },
  setTabLocked: (isLocked) => {
    dispatch(
      vmWizardActions[ActionType.SetTabLocked](wizardReduxID, VMWizardTab.NETWORKING, isLocked),
    );
  },
});

export const WizardErrors = connect(stateToProps, dispatchToProps, null, {
  areStatePropsEqual: _.isEqual,
})(Errors);
