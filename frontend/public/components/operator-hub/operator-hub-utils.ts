import * as _ from 'lodash-es';

export const operatorProviderTypeMap = {
  'redhat': 'Red Hat',
  'certified': 'Certified',
  'community': 'Community',
  'custom': 'Custom',
};

export const getOperatorProviderType = packageManifest => {
  const srcProvider = _.get(packageManifest, 'metadata.labels.opsrc-provider');
  return _.get(operatorProviderTypeMap, srcProvider, 'Custom');
};
