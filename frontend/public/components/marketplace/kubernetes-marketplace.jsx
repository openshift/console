import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {Helmet} from 'react-helmet';

import {Firehose, PageHeading, StatusBox, MsgBox} from '../utils';
import {referenceForModel} from '../../module/k8s';
import {PackageManifestModel, OperatorGroupModel, CatalogSourceConfigModel} from '../../models';
import {MarketplaceTileViewPage} from './kubernetes-marketplace-items';
import * as operatorImg from '../../imgs/operator.svg';

const MARKETPLACE_CSC_NAME = 'marketplace-enabled-operators';

const getPackages = (catalogsourceconfigs) => {
  const marketplaceCSC = catalogsourceconfigs ? _.filter(catalogsourceconfigs.data, (csc) => {
    const name = _.get(csc, 'metadata.name', false);
    return name === MARKETPLACE_CSC_NAME;
  }) : [];
  if (_.isEmpty(marketplaceCSC)) {
    return '';
  }
  const packages = _.get(marketplaceCSC[0], 'spec.packages');

  return _.map(packages.split(','), pkg => pkg.trim());
};

const normalizePackageManifests = (packageManifests, kind, catalogsourceconfigs) => {
  const enabledPackages = getPackages(catalogsourceconfigs);
  const activePackageManifests = _.filter(packageManifests, packageManifest => {
    return !packageManifest.status.removedFromBrokerCatalog;
  });
  return _.map(activePackageManifests, packageManifest => {
    const name = packageManifest.metadata.name;
    const uid = `${name}/${packageManifest.status.catalogSourceNamespace}`;
    const defaultIconClass = 'fa fa-clone';
    const iconObj = _.get(packageManifest, 'status.channels[0].currentCSVDesc.icon[0]');
    const imgUrl = iconObj ? `data:${iconObj.mediatype};base64,${iconObj.base64data}` : operatorImg;
    const iconClass = imgUrl ? null : defaultIconClass;
    const provider = _.get(packageManifest, 'metadata.labels.provider');
    const tags = packageManifest.metadata.tags;
    const version = _.get(packageManifest, 'status.channels[0].currentCSVDesc.version');
    const currentCSVAnnotations = _.get(packageManifest, 'status.channels[0].currentCSVDesc.annotations', {});
    const enabled = _.includes(enabledPackages, name);
    let {
      description,
      certifiedLevel,
      healthIndex,
      repository,
      containerImage,
      createdAt,
      support,
      longDescription,
      categories,
    } = currentCSVAnnotations;
    const categoryArray = categories && _.map(categories.split(','), category => category.trim());
    longDescription = longDescription ? longDescription : _.get(packageManifest, 'status.channels[0].currentCSVDesc.description');
    const catalogSource = _.get(packageManifest, 'status.catalogSource');
    const catalogSourceNamespace = _.get(packageManifest, 'status.catalogSourceNamespace');
    return {
      obj: packageManifest,
      kind,
      name,
      uid,
      iconClass,
      imgUrl,
      description,
      provider,
      tags,
      version,
      certifiedLevel,
      healthIndex,
      repository,
      containerImage,
      createdAt,
      support,
      longDescription,
      categories: categoryArray,
      catalogSource,
      catalogSourceNamespace,
      enabled,
    };
  });
};

const getItems = (props) => {
  const {packagemanifests, catalogsourceconfigs, loaded} = props;
  if (!loaded || !packagemanifests){
    return [];
  }
  const packageManifestItems = normalizePackageManifests(packagemanifests.data, 'PackageManifest', catalogsourceconfigs);
  return _.sortBy([...packageManifestItems], 'name');
};

export class MarketplaceListPage extends React.Component {
  constructor() {
    super();
    this.state = {
      selectedItem: null,
    };
  }

  static getDerivedStateFromProps(props, state) {
    const {packagemanifests} = props;
    if (packagemanifests !== state.packagemanifests) {
      const items = getItems(props);
      return {items, packagemanifests};
    }
    return {};
  }

  render() {
    const {catalogsourceconfigs, loaded, loadError} = this.props;
    const {items} = this.state;
    return <StatusBox data={items} loaded={loaded} loadError={loadError} label="Resources" EmptyMsg={() => <MsgBox title="No Marketplace Items Found" detail="Please check that the marketplace operator is running. If you are using your own quay.io appregistry, please ensure your operators are properly documented. For more information visit https://github.com/operator-framework/operator-marketplace" />} >
      <MarketplaceTileViewPage items={items} catalogsourceconfigs={catalogsourceconfigs} />
    </StatusBox>;
  }
}
MarketplaceListPage.displayName = 'MarketplaceList';
MarketplaceListPage.propTypes = {
  obj: PropTypes.object,
};

export const Marketplace = () => {
  const resources = [];
  resources.push({
    isList: true,
    kind: referenceForModel(CatalogSourceConfigModel),
    namespace: 'openshift-operators',
    prop: 'catalogsourceconfigs',
  });
  resources.push({
    isList: true,
    kind: referenceForModel(OperatorGroupModel),
    prop: 'operatorgroups',
  });
  resources.push({
    isList: true,
    kind: referenceForModel(PackageManifestModel),
    namespace: 'openshift-operators',
    prop: 'packagemanifests',
    selector: {matchLabels: {'openshift-marketplace':'true'}},
  });
  return <Firehose resources={resources} className="co-catalog-connect">
    <MarketplaceListPage />
  </Firehose>;
};
Marketplace.displayName = 'Marketplace';

export const MarketplacePage = () => {
  return <React.Fragment>
    <Helmet>
      <title>Kubernetes Marketplace</title>
    </Helmet>
    <div className="co-catalog">
      <PageHeading title="Kubernetes Marketplace" />
      <Marketplace />
    </div>
  </React.Fragment>;
};
