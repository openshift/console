import { iGet, iGetIn } from '../../../../utils/immutable';
import { VMWizardStorageType, VMWizardTab } from '../../types';
import { iGetCreateVMWizardTabs } from './selectors';

export const iGetStorages = (state, id: string) =>
  iGetIn(iGetCreateVMWizardTabs(state, id), [VMWizardTab.STORAGE, 'value']);

export const iGetProvisionSourceStorage = (state, id: string) =>
  iGetStorages(state, id).find((storage) =>
    [
      VMWizardStorageType.PROVISION_SOURCE_DISK,
      VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK,
    ].includes(iGet(storage, 'type')),
  );
