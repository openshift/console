import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import { FLAGS, connectToFlags, flagPending } from '../../features';
import { Firehose, PageHeading, StatusBox } from '../utils';
import { CatalogTileViewPage } from '../catalog-items';
import { referenceForModel } from '../../module/k8s';
import { getServiceClassIcon, getServiceClassImage } from '../catalog-item-icon';
import { PackageManifestModel } from '../../models';

class MarketplaceListPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
    };
  }
  componentDidUpdate(prevProps) {
    const {packagemanifests, namespace} = this.props;
    if (packagemanifests !== prevProps.packagemanifests ||
      namespace !== prevProps.namespace) {
      this.createMarketplaceData();
    }
  }
  createMarketplaceData() {
    const {packagemanifests, loaded} = this.props;
    let packageManifestItems = null;
    if (!loaded) {
      return;
    }
    if (packagemanifests) {
      packageManifestItems = this.normalizePackageManifests(packagemanifests.data, 'PackageManifest');
    }
    const items = _.sortBy([...packageManifestItems], 'tileName');
    this.setState({items});
  }
  normalizePackageManifests(packageManifests, kind) {
    const activePackageManifests = _.filter(packageManifests, packageManifest => {
      return !packageManifest.status.removedFromBrokerCatalog;
    });
    return _.map(activePackageManifests, packageManifest => {
      const tileName = packageManifest.metadata.name;
      const iconClass = getServiceClassIcon(packageManifest);
      const tileImgUrl = getServiceClassImage(packageManifest, iconClass);
      const tileIconClass = tileImgUrl ? null : iconClass;
      const tileDescription = packageManifest.metadata.description;
      const tileProvider = packageManifest.metadata.labels.provider;
      const tags = packageManifest.metadata.tags;
      const { name, namespace } = packageManifest.metadata;
      const href = null;
      return {
        obj: packageManifest,
        kind,
        tileName,
        tileIconClass,
        tileImgUrl,
        tileDescription,
        tileProvider,
        href,
        tags,
      };
    });
  }
  render() {
    const { loaded, loadError } = this.props;
    const { items } = this.state;
    return <StatusBox data={items} loaded={loaded} loadError={loadError} label="Resources">
      <CatalogTileViewPage items={items} />
    </StatusBox>;
  }
}
MarketplaceListPage.displayName = 'MarketplaceList';
MarketplaceListPage.propTypes = {
  obj: PropTypes.object,
  namespace: PropTypes.string,
};
// eventually may use namespace
// eslint-disable-next-line no-unused-vars
export const Marketplace = connectToFlags(FLAGS.OPENSHIFT, FLAGS.SERVICE_CATALOG)(({namespace, flags}) => {
  if (flagPending(flags.OPENSHIFT) || flagPending(flags.SERVICE_CATALOG)) {
    return null;
  }
  const resources = [];
  resources.push({
    isList: true,
    kind: referenceForModel(PackageManifestModel),
    namespace: 'kube-system',
    prop: 'packagemanifests'
  });
  return <Firehose resources={resources}>
    <MarketplaceListPage namespace={namespace} />
  </Firehose>;
});
Marketplace.displayName = 'Marketplace';
Marketplace.propTypes = {
  namespace: PropTypes.string,
};
export const MarketplacePage = ({match}) => {
  const namespace = _.get(match, 'params.ns');
  return <React.Fragment>
    <Helmet>
      <title>Kubernetes Marketplace</title>
    </Helmet>
    <div className="co-catalog">
      <PageHeading title="Kubernetes Marketplace" />
      <Marketplace namespace={namespace} />
    </div>
  </React.Fragment>;
};
