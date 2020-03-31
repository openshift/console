import { VMImportProvider } from '../types';

const titleResolver = {
  [VMImportProvider.OVIRT]: 'Red Hat Virtualization',
  [VMImportProvider.VMWARE]: 'VMware',
};

export const getProviderName = (provider: VMImportProvider) => titleResolver[provider];
