import { VMWizardStorage } from '../../types';
import { StorageSimpleData } from '../../../vm-disks/types';

export type VMWizardStorageBundle = StorageSimpleData & {
  wizardStorageData: VMWizardStorage;
};

export type VMWizardStorageRowActionOpts = {
  wizardReduxID: string;
  removeStorage?: (id: string) => void;
  withProgress?: (promise: Promise<any>) => void;
};

export type VMWizardStorageRowCustomData = VMWizardStorageRowActionOpts & {
  columnClasses: string[];
  isDisabled: boolean;
};
