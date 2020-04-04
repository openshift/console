import { VMImportProvider } from '../types';

const titleResolver = {
  [VMImportProvider.OVIRT]: 'Red Hat Virtualization',
  [VMImportProvider.VMWARE]: 'VMware',
};

const endpointTitleResolver = {
  [VMImportProvider.OVIRT]: 'Red Hat Virtualization API',
  [VMImportProvider.VMWARE]: 'vCenter',
};

export const getProviderName = (provider: VMImportProvider) => titleResolver[provider];

export const getProviderEndpointName = (provider: VMImportProvider) =>
  endpointTitleResolver[provider];
