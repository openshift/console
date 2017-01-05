export const cloudProviderID = (node) => {
  return node.spec.providerID ? node.spec.providerID.split('://')[0] : '';
};

export const cloudProviderNames = (providerNames) => {
  if (providerNames.length) {
    const displayNames = providerNames.length === 1 ? providerNames[0] : `Hybrid (${providerNames.join(' , ')})`;
    return displayNames.replace(/aws/i, 'Amazon Web Services');
  }
  return '';

};

