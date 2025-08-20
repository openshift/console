import { NodeKind } from '@console/internal/module/k8s';

export const cloudProviderID = (node: NodeKind): string => {
  return node.spec.providerID ? node.spec.providerID.split('://')[0] : '';
};

export const cloudProviderNames = (providerNames: string[]): string => {
  if (providerNames.length) {
    const displayNames =
      providerNames.length === 1 ? providerNames[0] : `Hybrid (${providerNames.join(' , ')})`;
    return displayNames.replace(/aws/i, 'Amazon Web Services');
  }
  return '';
};
