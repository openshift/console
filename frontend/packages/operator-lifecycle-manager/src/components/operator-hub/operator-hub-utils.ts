export const operatorProviderTypeMap = {
  'redhat-operators': 'Red Hat',
  'redhat-marketplace': 'Marketplace',
  'certified-operators': 'Certified',
  'community-operators': 'Community',
};

export const getOperatorProviderType = (packageManifest) => {
  const { catalogSource, catalogSourceDisplayName } = packageManifest.status;
  return operatorProviderTypeMap?.[catalogSource] || catalogSourceDisplayName || catalogSource;
};
