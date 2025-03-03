import { K8sResourceKind } from '@console/internal/module/k8s';

// The config is a JSON object with the NetworkAttachmentDefinitionConfig type stored as a string
export type NetworkAttachmentDefinitionSpec = {
  config: string;
};

export type NetworkAttachmentDefinitionKind = {
  spec?: NetworkAttachmentDefinitionSpec;
} & K8sResourceKind;
