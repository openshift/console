import { getVmWareInitialState } from './redux/initial-state/providers/vmware-initial-state';
import { VMImportProvider } from './types';
import { getVMWareProviderStateUpdater } from './redux/stateUpdate/vmSettings/providers/vmware-state-update';
import { UpdateOptions } from './redux/types';
import { cleanupVmWareProvider } from './redux/stateUpdate/vmSettings/providers/vmware-cleanup';

type Provider = {
  id: VMImportProvider;
  name: string;
  getInitialState?: () => any;
  getStateUpdater?: (options: UpdateOptions) => any;
  cleanup?: (options: UpdateOptions) => any;
};

// TODO: make imports async
export const getProviders = (): Provider[] => [
  {
    name: 'VMware',
    id: VMImportProvider.VMWARE,
    getInitialState: getVmWareInitialState,
    getStateUpdater: getVMWareProviderStateUpdater,
    cleanup: cleanupVmWareProvider,
  },
];
