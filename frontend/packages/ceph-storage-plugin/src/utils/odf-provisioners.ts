import { ProvisionerDetails } from 'packages/console-dynamic-plugin-sdk';

type Parameters = ProvisionerDetails['parameters'];

export const isEncryptionKMSIdVisibleOrRequired = (params: Parameters) =>
  params?.encrypted?.value === 'true';
