import { VMImportProvider } from '../types';

const titleResolver = {
  [VMImportProvider.OVIRT]: (isUpstream: boolean) =>
    isUpstream ? 'oVirt/RHV' : 'Red Hat Virtualization (RHV)',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [VMImportProvider.VMWARE]: (isUpstream: boolean) => 'VMware',
};

const endpointTitleResolver = {
  [VMImportProvider.OVIRT]: (isUpstream: boolean) =>
    isUpstream ? 'the oVirt/RHV API' : 'the RHV API',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [VMImportProvider.VMWARE]: (isUpstream: boolean) => 'vCenter',
};

export const getProviderName = (provider: VMImportProvider) => {
  const isUpstream = window?.SERVER_FLAGS?.branding === 'okd';
  return titleResolver[provider](isUpstream);
};

export const getProviderEndpointName = (provider: VMImportProvider) => {
  const isUpstream = window?.SERVER_FLAGS?.branding === 'okd';
  return endpointTitleResolver[provider](isUpstream);
};
