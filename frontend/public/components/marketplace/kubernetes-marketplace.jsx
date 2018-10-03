import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import { Firehose, PageHeading, StatusBox } from '../utils';
import { referenceForModel } from '../../module/k8s';
import { normalizeIconClass } from '../catalog-item-icon';
import { PackageManifestModel } from '../../models';
import CatalogTileView from 'patternfly-react-extensions/dist/esm/components/CatalogTileView/CatalogTileView';
import CatalogTile from 'patternfly-react-extensions/dist/esm/components/CatalogTile/CatalogTile';

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
      const iconClass = 'fa fa-clone'; // TODO: get this info from the packagemanifest
      const tileImgUrl = null; // TODO: get this info from the packagemanifest
      const tileIconClass = tileImgUrl ? null : iconClass;
      const tileDescription = packageManifest.metadata.description;
      const tileProvider = packageManifest.metadata.labels.provider;
      const tags = packageManifest.metadata.tags;
      return {
        obj: packageManifest,
        kind,
        tileName,
        tileIconClass,
        tileImgUrl,
        tileDescription,
        tileProvider,
        tags,
      };
    });
  }

  renderTiles() {
    const { items } = this.state;

    return (
      <CatalogTileView.Category totalItems={items.length} viewAll={true}>
        {_.map(items, ((item) => {
          const { tileName, tileImgUrl, tileIconClass, tileProvider, tileDescription } = item;
          const uid = tileName;
          const iconClass = tileIconClass ? `icon ${normalizeIconClass(tileIconClass)}` : null;
          const vendor = tileProvider ? `Provided by ${tileProvider}` : null;
          return <CatalogTile
            id={uid}
            key={uid}
            title={tileName}
            iconImg={tileImgUrl}
            iconClass={iconClass}
            vendor={vendor}
            description={tileDescription}
          />;
        }))}
      </CatalogTileView.Category>
    );
  }

  render() {
    const { loaded, loadError } = this.props;
    const { items } = this.state;
    return <StatusBox data={items} loaded={loaded} loadError={loadError} label="Resources">
      <div className="co-catalog-page">
        <div className="co-catalog-page__content">
          <div>
            <div className="co-catalog-page__num-items">{_.size(items)} items</div>
          </div>
          <CatalogTileView>
            {this.renderTiles()}
          </CatalogTileView>
        </div>
      </div>
    </StatusBox>;
  }
}
MarketplaceListPage.displayName = 'MarketplaceList';
MarketplaceListPage.propTypes = {
  obj: PropTypes.object,
  namespace: PropTypes.string,
};

export const Marketplace = ({namespace}) => {
  const resources = [];
  resources.push({
    isList: true,
    kind: referenceForModel(PackageManifestModel),
    namespace: undefined, // shows operators from all-namespaces - when backend is hooked up we will use 'marketplace'
    prop: 'packagemanifests'
  });
  return <Firehose resources={resources}>
    <MarketplaceListPage namespace={namespace} />
  </Firehose>;
};
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
