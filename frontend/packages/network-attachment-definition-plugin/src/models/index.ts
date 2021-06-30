import { K8sKind } from '@console/internal/module/k8s';

export const NetworkAttachmentDefinitionModel: K8sKind = {
  label: 'Network Attachment Definition',
  labelPlural: 'Network Attachment Definitions',
  apiVersion: 'v1',
  apiGroup: 'k8s.cni.cncf.io',
  plural: 'network-attachment-definitions',
  namespaced: true,
  abbr: 'NAD',
  kind: 'NetworkAttachmentDefinition',
  id: 'network-attachment-definition',
  crd: true,
  legacyPluralURL: true,
};

export const SriovNetworkNodePolicyModel: K8sKind = {
  label: 'SR-IOV Network Node Policy',
  labelPlural: 'SR-IOV Network Node Policies',
  apiVersion: 'v1',
  apiGroup: 'sriovnetwork.openshift.io',
  plural: 'sriovnetworknodepolicies',
  namespaced: true,
  abbr: 'SRNNPM', // TODO check on this
  kind: 'SriovNetworkNodePolicy',
  id: 'sriov-network-node-policy',
  crd: true,
};
