import { NetworkSimpleData } from '../../../vm-nics/types';
import { VMWizardNetwork } from '../../types';

export type VMWizardNetworkBundle = NetworkSimpleData & {
  wizardNetworkData: VMWizardNetwork;
};

export type VMWizardNicRowActionOpts = {
  wizardReduxID: string;
  removeNIC?: (id: string) => void;
  withProgress?: (promise: Promise<any>) => void;
  isUpdateDisabled: boolean;
  isDeleteDisabled: boolean;
};

export type VMWizardNicRowCustomData = VMWizardNicRowActionOpts & {
  columnClasses: string[];
  isDisabled: boolean;
};
