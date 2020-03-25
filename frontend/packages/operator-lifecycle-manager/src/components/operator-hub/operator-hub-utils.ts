import * as _ from 'lodash';

export const operatorProviderTypeMap = {
  redhat: 'Red Hat',
  marketplace: 'Marketplace',
  certified: 'Certified',
  community: 'Community',
};

const getCustomOperatorProviderType = (packageManifest) => {
  return (
    packageManifest.metadata?.annotations?.['marketplace.openshift.io/display-name'] ||
    packageManifest.metadata.name
  );
};

export const getOperatorProviderType = (packageManifest) => {
  const srcProvider = _.get(packageManifest, 'metadata.labels.opsrc-provider');
  return _.get(
    operatorProviderTypeMap,
    srcProvider,
    getCustomOperatorProviderType(packageManifest),
  );
};
