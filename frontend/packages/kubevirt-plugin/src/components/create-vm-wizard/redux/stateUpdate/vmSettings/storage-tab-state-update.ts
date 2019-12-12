import {
  hasVmSettingsChanged,
  iGetProvisionSource,
} from '../../../selectors/immutable/vm-settings';
import { VMSettingsField, VMWizardStorage, VMWizardStorageType } from '../../../types';
import { InternalActionType, UpdateOptions } from '../../types';
import { iGetProvisionSourceStorage } from '../../../selectors/immutable/storage';
import { getProvisionSourceStorage } from '../../initial-state/storage-tab-initial-state';
import { VolumeWrapper } from '../../../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../../../k8s/wrapper/vm/data-volume-wrapper';
import { StorageUISource } from '../../../../modals/disk-modal/storage-ui-source';
import { getNextIDResolver } from '../../../../../utils/utils';
import { getStorages } from '../../../selectors/selectors';
import { vmWizardInternalActions } from '../../internal-actions';

export const prefillInitialDiskUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (!hasVmSettingsChanged(prevState, state, id, VMSettingsField.PROVISION_SOURCE_TYPE)) {
    return;
  }

  const iOldSourceStorage = iGetProvisionSourceStorage(state, id);
  const oldSourceStorage: VMWizardStorage = iOldSourceStorage && iOldSourceStorage.toJSON();

  const newSourceStorage = getProvisionSourceStorage(iGetProvisionSource(state, id));
  const oldType =
    oldSourceStorage &&
    StorageUISource.fromTypes(
      VolumeWrapper.initialize(oldSourceStorage.volume).getType(),
      DataVolumeWrapper.initialize(oldSourceStorage.dataVolume).getType(),
    );

  const newType =
    newSourceStorage &&
    StorageUISource.fromTypes(
      VolumeWrapper.initialize(newSourceStorage.volume).getType(),
      DataVolumeWrapper.initialize(newSourceStorage.dataVolume).getType(),
    );

  if (newType !== oldType) {
    if (!newSourceStorage) {
      // not a template provision source
      if (oldSourceStorage && oldSourceStorage.type === VMWizardStorageType.PROVISION_SOURCE_DISK) {
        dispatch(
          vmWizardInternalActions[InternalActionType.RemoveStorage](id, oldSourceStorage.id),
        );
      }
    } else {
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateStorage](id, {
          id: oldSourceStorage ? oldSourceStorage.id : getNextIDResolver(getStorages(state, id))(),
          ...newSourceStorage,
        }),
      );
    }
  }
};

export const updateStorageTabState = (options: UpdateOptions) =>
  [prefillInitialDiskUpdater].forEach((updater) => {
    updater && updater(options);
  });
