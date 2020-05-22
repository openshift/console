import { getVmWareInitialState } from './redux/initial-state/providers/vmware-initial-state';
import { VMImportProvider } from './types';
import { getVMWareProviderStateUpdater } from './redux/state-update/providers/vmware/vmware-state-update';
import { UpdateOptions } from './redux/types';
import { cleanupVmWareProvider } from './redux/state-update/providers/vmware/vmware-cleanup';
import { getV2VVMwareImportProvidersTabValidity } from './redux/validations/providers/v2vvmware-tab-validation';
import { getOvirtInitialState } from './redux/initial-state/providers/ovirt-initial-state';
import { getOvirtProviderStateUpdater } from './redux/state-update/providers/ovirt/ovirt-state-update';
import { getProviderName } from './strings/import-providers';
import { cleanupOvirtProvider } from './redux/state-update/providers/ovirt/ovirt-cleanup';
import {
  getOvirtProviderProvidersTabValidity,
  validateOvirtSettings,
} from './redux/validations/providers/ovirt-provider-tab-validation';

type Provider = {
  id: VMImportProvider;
  name: string;
  getInitialState?: () => any;
  getStateUpdater?: (options: UpdateOptions) => any;
  getImportProvidersTabValidity?: (
    options: UpdateOptions,
  ) => { hasAllRequiredFilled: boolean; isValid: boolean; error: string };
  validate?: (options: UpdateOptions) => any;
  cleanup?: (options: UpdateOptions) => any;
};

// TODO: make imports async
export const getProviders = (): Provider[] => [
  {
    name: getProviderName(VMImportProvider.OVIRT),
    id: VMImportProvider.OVIRT,
    getInitialState: getOvirtInitialState,
    getStateUpdater: getOvirtProviderStateUpdater,
    getImportProvidersTabValidity: getOvirtProviderProvidersTabValidity,
    validate: validateOvirtSettings,
    cleanup: cleanupOvirtProvider,
  },
  {
    name: getProviderName(VMImportProvider.VMWARE),
    id: VMImportProvider.VMWARE,
    getInitialState: getVmWareInitialState,
    getStateUpdater: getVMWareProviderStateUpdater,
    getImportProvidersTabValidity: getV2VVMwareImportProvidersTabValidity,
    cleanup: cleanupVmWareProvider,
  },
];
