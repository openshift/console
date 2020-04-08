import { VMWizardTab } from '../../types';
import { InternalActionType, UpdateOptions } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import { validateDisk } from '../../../../utils/validations/vm';
import { iGetIn } from '../../../../utils/immutable';
import { checkTabValidityChanged } from '../../selectors/immutable/selectors';
import { getStorages } from '../../selectors/selectors';
import { hasStoragesChanged, iGetStorages } from '../../selectors/immutable/storage';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { getTemplateValidation } from '../../selectors/template';
import { TemplateValidations } from '../../../../utils/validations/template/template-validations';
import { getName } from '@console/shared/src';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { PersistentVolumeClaimWrapper } from '../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';

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

  const storages = getStorages(state, id);

  const validatedStorages = storages.map((storage) => {
    const otherStorageBundles = storages.filter((n) => n.id !== storage.id); // to discard storages with a same name
    const usedDiskNames = new Set(otherStorageBundles.map(({ disk }) => disk?.name));

    const usedPVCNames: Set<string> = new Set(
      otherStorageBundles
        .filter(({ dataVolume }) => dataVolume)
        .map(({ dataVolume }) => getName(dataVolume)),
    );

    return {
      ...storage,
      validation: validateDisk(
        new DiskWrapper(storage.disk),
        new VolumeWrapper(storage.volume),
        storage.dataVolume && new DataVolumeWrapper(storage.dataVolume),
        storage.persistentVolumeClaim &&
          new PersistentVolumeClaimWrapper(storage.persistentVolumeClaim),
        {
          usedDiskNames,
          usedPVCNames,
          templateValidations: newValidations,
        },
      ),
    };
  });

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
        (iGetIn(storageBundle, ['dataVolume', 'spec', 'source', 'pvc']) ||
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
