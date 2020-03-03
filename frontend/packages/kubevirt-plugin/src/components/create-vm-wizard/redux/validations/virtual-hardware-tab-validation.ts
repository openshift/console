import { VMWizardTab } from '../../types';
import { InternalActionType, UpdateOptions } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import { iGetIn } from '../../../../utils/immutable';
import { checkTabValidityChanged } from '../../selectors/immutable/selectors';
import { iGetStorages } from '../../selectors/immutable/storage';

export const setVirtualHardwareTabValidity = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();

  const iStorages = iGetStorages(state, id).filter((iStorage) =>
    iGetIn(iStorage, ['disk', 'cdrom']),
  );

  const hasAllRequiredFilled = iStorages.every((iStorage) =>
    iGetIn(iStorage, ['validation', 'hasAllRequiredFilled']),
  );

  let isValid = hasAllRequiredFilled;

  if (isValid) {
    isValid = iStorages.every((iStorage) => iGetIn(iStorage, ['validation', 'isValid']));
  }

  if (
    checkTabValidityChanged(
      state,
      id,
      VMWizardTab.ADVANCED_VIRTUAL_HARDWARE,
      isValid,
      hasAllRequiredFilled,
      null,
    )
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.ADVANCED_VIRTUAL_HARDWARE,
        isValid,
        hasAllRequiredFilled,
        null,
      ),
    );
  }
};
