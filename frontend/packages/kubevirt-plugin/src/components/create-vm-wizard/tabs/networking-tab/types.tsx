import { NetworkSimpleData } from '../../../vm-nics/types';
import { VMWizardNetworkWithWrappers } from '../../types';

export type VMWizardNetworkBundle = NetworkSimpleData & {
  wizardNetworkData: VMWizardNetworkWithWrappers;
};

export type VMWizardNicRowActionOpts = {
  wizardReduxID: string;
  removeNIC?: (id: string) => void;
  withProgress?: (promise: Promise<any>) => void;
};

export type VMWizardNicRowCustomData = VMWizardNicRowActionOpts & {
  columnClasses: string[];
  isDisabled: boolean;
};
