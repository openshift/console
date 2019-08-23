import { K8sResourceKind } from '@console/internal/module/k8s';

export type IPAMConfig = {
  type?: string;
  subnet?: string;
  dataDir?: string;
};

export type NetworkAttachmentDefinitionConfig = {
  cniVersion?: string;
  name?: string;
  type?: string;
  bridge?: string;
  isGateway?: true;
  ipam?: IPAMConfig;
  plugins?: NetworkAttachmentDefinitionConfig[];
};

// The config is a JSON object with the NetworkAttachmentDefinitionConfig type stored as a string
export type NetworkAttachmentDefinitionSpec = {
  config: string;
};

export type NetworkAttachmentDefinitionKind = {
  spec?: NetworkAttachmentDefinitionSpec;
} & K8sResourceKind;
