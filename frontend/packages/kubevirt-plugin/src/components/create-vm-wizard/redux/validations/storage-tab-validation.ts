import { getName } from '@console/shared/src';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { PersistentVolumeClaimWrapper } from '../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { iGetIn } from '../../../../utils/immutable';
import { TemplateValidations } from '../../../../utils/validations/template/template-validations';
import { validateDisk } from '../../../../utils/validations/vm';
import { checkTabValidityChanged } from '../../selectors/immutable/selectors';
import { hasStoragesChanged, iGetStorages } from '../../selectors/immutable/storage';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { getStorages } from '../../selectors/selectors';
import { getTemplateValidation } from '../../selectors/template';
import { VMWizardTab } from '../../types';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions } from '../types';

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

  const iStorages = iGetStorages(state, id);
  let errorKey: string;

  let hasAllRequiredFilled = iStorages.every((iStorage) =>
    iGetIn(iStorage, ['validation', 'hasAllRequiredFilled']),
  );

  if (iGetProvisionSource(state, id) === ProvisionSource.DISK) {
    const hasBootSource = !!iStorages.find(
      (storageBundle) =>
        iGetIn(storageBundle, ['disk', 'bootOrder']) === 1 &&
        (iGetIn(storageBundle, ['disk', 'disk']) || iGetIn(storageBundle, ['disk', 'cdrom'])) &&
        (iGetIn(storageBundle, ['volume', 'persistentVolumeClaim']) ||
          iGetIn(storageBundle, ['volume', 'containerDisk']) ||
          iGetIn(storageBundle, ['dataVolume', 'spec', 'source', 'pvc']) ||
          iGetIn(storageBundle, ['dataVolume', 'spec', 'source', 'registry']) ||
          iGetIn(storageBundle, ['dataVolume', 'spec', 'source', 'http'])),
    );
    if (!hasBootSource) {
      // t('kubevirt-plugin~Please select a disk with a defined boot source.')
      errorKey = 'kubevirt-plugin~Please select a disk with a defined boot source.';
      hasAllRequiredFilled = false;
    }
  }

  let isValid = hasAllRequiredFilled;

  if (isValid) {
    isValid = iStorages.every((iStorage) => iGetIn(iStorage, ['validation', 'isValid']));
  }

  if (
    checkTabValidityChanged(
      state,
      id,
      VMWizardTab.STORAGE,
      isValid,
      hasAllRequiredFilled,
      errorKey,
      null,
    )
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.STORAGE,
        isValid,
        hasAllRequiredFilled,
        errorKey,
      ),
    );
  }
};
