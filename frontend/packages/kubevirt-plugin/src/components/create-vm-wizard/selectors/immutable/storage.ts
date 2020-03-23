import { iGet, iGetIn } from '../../../../utils/immutable';
import { VMWizardStorageType, VMWizardTab } from '../../types';
import { iGetCreateVMWizardTabs } from './common';

export const iGetStorages = (state, id: string) =>
  iGetIn(iGetCreateVMWizardTabs(state, id), [VMWizardTab.STORAGE, 'value']);

export const iGetProvisionSourceStorage = (state, id: string) =>
  iGetStorages(state, id).find((storage) =>
    [
      VMWizardStorageType.PROVISION_SOURCE_DISK,
      VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK,
    ].includes(iGet(storage, 'type')),
  );

export const iGetCloudInitNoCloudStorage = (state, id: string) =>
  iGetStorages(state, id).find((storage) => iGetIn(storage, ['volume', 'cloudInitNoCloud']));

export const hasStoragesChanged = (prevState, state, id: string) => {
  const prevIStorages = iGetStorages(prevState, id);
  const iStorages = iGetStorages(state, id);

  return (
    (!prevIStorages && !iStorages) ||
    prevIStorages?.size !== iStorages?.size ||
    !!prevIStorages.find(
      (prevIStorage, prevIStorageIndex) => prevIStorage !== iStorages.get(prevIStorageIndex),
    )
  );
};
