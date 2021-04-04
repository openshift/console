import { iGetCommonData } from '../../selectors/immutable/selectors';
import {
  isStepHidden,
  isStepPending,
  isStepValid,
} from '../../selectors/immutable/wizard-selectors';
import {
  ALL_VM_WIZARD_TABS,
  VM_WIZARD_DIFFICULT_TABS,
  VMWizardProps,
  VMWizardTab,
} from '../../types';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions } from '../types';

export const finalizeImportProviderStateUpdate = (options: UpdateOptions) => {
  const { id, getState, dispatch } = options;
  const state = getState();

  if (!iGetCommonData(state, options.id, VMWizardProps.isProviderImport)) {
    return;
  }

  if (isStepValid(state, id, VMWizardTab.RESULT) || isStepPending(state, id, VMWizardTab.RESULT)) {
    return;
  }

  if (isStepValid(state, id, VMWizardTab.IMPORT_PROVIDERS)) {
    const isWizardValid = !ALL_VM_WIZARD_TABS.filter((tab) => tab !== VMWizardTab.RESULT).some(
      (tab) => !isStepValid(state, id, tab),
    );

    if (!isWizardValid) {
      // make sure that the user can see and go straight to the wrong tab and doesn't have to click edit
      VM_WIZARD_DIFFICULT_TABS.forEach((difficultTab) => {
        if (isStepHidden(getState(), id, difficultTab)) {
          dispatch(
            vmWizardInternalActions[InternalActionType.SetTabHidden](id, difficultTab, false),
          );
        }
      });
    }
  }
};
