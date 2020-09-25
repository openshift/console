import { VMImportProvider } from '../types';

const titleResolver = {
  [VMImportProvider.OVIRT]: 'Red Hat Virtualization (RHV)',
  [VMImportProvider.VMWARE]: 'VMware',
};

const endpointTitleResolver = {
  [VMImportProvider.OVIRT]: 'the RHV API',
  [VMImportProvider.VMWARE]: 'vCenter',
};

export const getProviderName = (provider: VMImportProvider) => titleResolver[provider];

export const getProviderEndpointName = (provider: VMImportProvider) =>
  endpointTitleResolver[provider];
