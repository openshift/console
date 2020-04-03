import { VMWizardTab } from '../../types';
import { InternalActionType, UpdateOptions } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import { validateDisk } from '../../../../utils/validations/vm';
import { iGetIn } from '../../../../utils/immutable';
import { checkTabValidityChanged } from '../../selectors/immutable/selectors';
import { getStoragesWithWrappers } from '../../selectors/selectors';
import { hasStoragesChanged, iGetStorages } from '../../selectors/immutable/storage';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { getTemplateValidation } from '../../selectors/template';
import { TemplateValidations } from '../../../../utils/validations/template/template-validations';

export const validateStorages = (options: UpdateOptions) => {
  const { id, prevState, dispatch, getState } = options;
  const state = getState();

  // we care only about the first TemplateValidation because storage shows up after the first step
  const oldValidations = getTemplateValidation(prevState, id);
  const newValidations = getTemplateValidation(state, id);

  if (
    TemplateValidations.areBusesEqual(oldValidations, newValidations) &&
    !hasStoragesChanged(prevState, state, id)
  ) {
    return;
  }

  const storages = getStoragesWithWrappers(state, id);

  const validatedStorages = storages.map(
    ({
      diskWrapper,
      volumeWrapper,
      dataVolumeWrapper,
      persistentVolumeClaimWrapper,
      ...storageBundle
    }) => {
      const otherStorageBundles = storages.filter((n) => n.id !== storageBundle.id); // to discard networks with a same name
      const usedDiskNames = new Set(otherStorageBundles.map(({ diskWrapper: dw }) => dw.getName()));

      const usedPVCNames: Set<string> = new Set(
        otherStorageBundles
          .filter(({ dataVolume }) => dataVolume)
          .map(({ dataVolumeWrapper: dvw }) => dvw.getName()),
      );

      return {
        ...storageBundle,
        validation: validateDisk(
          diskWrapper,
          volumeWrapper,
          dataVolumeWrapper,
          persistentVolumeClaimWrapper,
          {
            usedDiskNames,
            usedPVCNames,
            templateValidations: newValidations,
          },
        ),
      };
    },
  );

  dispatch(vmWizardInternalActions[InternalActionType.SetStorages](id, validatedStorages));
};

export const setStoragesTabValidity = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();

  const iStorages = iGetStorages(state, id).filter(
    (iStorage) => !iGetIn(iStorage, ['disk', 'cdrom']),
  );
  let error = null;

  let hasAllRequiredFilled = iStorages.every((iStorage) =>
    iGetIn(iStorage, ['validation', 'hasAllRequiredFilled']),
  );

  if (iGetProvisionSource(state, id) === ProvisionSource.DISK) {
    const hasBootSource = !!iStorages.find(
      (storageBundle) =>
        iGetIn(storageBundle, ['disk', 'bootOrder']) === 1 &&
        iGetIn(storageBundle, ['disk', 'disk']) &&
        (iGetIn(storageBundle, ['volume', 'dataVolume', 'spec', 'source', 'pvc']) ||
          iGetIn(storageBundle, ['volume', 'persistentVolumeClaim'])),
    );
    if (!hasBootSource) {
      error = 'Please select the boot source.';
      hasAllRequiredFilled = false;
    }
  }

  let isValid = hasAllRequiredFilled;

  if (isValid) {
    isValid = iStorages.every((iStorage) => iGetIn(iStorage, ['validation', 'isValid']));
  }

  if (
    checkTabValidityChanged(state, id, VMWizardTab.STORAGE, isValid, hasAllRequiredFilled, error)
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.STORAGE,
        isValid,
        hasAllRequiredFilled,
        error,
      ),
    );
  }
};
