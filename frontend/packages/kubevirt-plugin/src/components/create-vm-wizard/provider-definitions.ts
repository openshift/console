import { getVmWareInitialState } from './redux/initial-state/providers/vmware-initial-state';
import { VMImportProvider } from './types';
import { getVMWareProviderStateUpdater } from './redux/stateUpdate/vmSettings/providers/vmware-state-update';
import { UpdateOptions } from './redux/types';
import { cleanupVmWareProvider } from './redux/stateUpdate/vmSettings/providers/vmware-cleanup';
import { getV2VVMwareImportProvidersTabValidity } from './redux/validations/providers/v2vvmware-tab-validation';

type Provider = {
  id: VMImportProvider;
  name: string;
  getInitialState?: () => any;
  getStateUpdater?: (options: UpdateOptions) => any;
  getImportProvidersTabValidity?: (
    options: UpdateOptions,
  ) => { hasAllRequiredFilled: boolean; isValid: boolean; error: string };
  cleanup?: (options: UpdateOptions) => any;
};

// TODO: make imports async
export const getProviders = (): Provider[] => [
  {
    name: 'VMware',
    id: VMImportProvider.VMWARE,
    getInitialState: getVmWareInitialState,
    getStateUpdater: getVMWareProviderStateUpdater,
    getImportProvidersTabValidity: getV2VVMwareImportProvidersTabValidity,
    cleanup: cleanupVmWareProvider,
  },
];
