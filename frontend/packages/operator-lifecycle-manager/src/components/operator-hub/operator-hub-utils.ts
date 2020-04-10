import * as _ from 'lodash';

export const operatorProviderTypeMap = {
  redhat: 'Red Hat',
  marketplace: 'Marketplace',
  certified: 'Certified',
  community: 'Community',
};

const getCustomOperatorProviderType = (packageManifest) =>
  packageManifest.status.catalogSourceDisplayName || packageManifest.status.catalogSource;
export const getOperatorProviderType = (packageManifest) => {
  const srcProvider = _.get(packageManifest, 'metadata.labels.opsrc-provider');
  return _.get(
    operatorProviderTypeMap,
    srcProvider,
    getCustomOperatorProviderType(packageManifest),
  );
};
