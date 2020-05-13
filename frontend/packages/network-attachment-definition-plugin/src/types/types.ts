import { K8sResourceKind } from '@console/internal/module/k8s';

export type NetworkAttachmentDefinitionAnnotations = {
  description?: string;
  'k8s.v1.cni.cncf.io/resourceName': string;
};

export type IPAMConfig = {
  type?: string;
  subnet?: string;
  dataDir?: string;
};

export type NetworkAttachmentDefinitionPlugin = {
  [key: string]: any;
};

export type NetworkAttachmentDefinitionConfig = {
  cniVersion: string;
  name: string;
  type?: string;
  bridge?: string;
  isGateway?: true;
  ipam?: IPAMConfig;
  plugins?: NetworkAttachmentDefinitionPlugin[];
};

// The config is a JSON object with the NetworkAttachmentDefinitionConfig type stored as a string
export type NetworkAttachmentDefinitionSpec = {
  config: string;
};

export type NetworkAttachmentDefinitionKind = {
  spec?: NetworkAttachmentDefinitionSpec;
} & K8sResourceKind;

export type TypeParamsDataItem = {
  value?: any;
  validationMsg?: string;
};

export type TypeParamsData = {
  [key: string]: TypeParamsDataItem;
};
