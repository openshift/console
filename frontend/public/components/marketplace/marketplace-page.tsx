/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import {Helmet} from 'react-helmet';

import {Firehose, PageHeading, StatusBox, MsgBox} from '../utils';
import {referenceForModel, K8sResourceKind} from '../../module/k8s';
import {PackageManifestModel, OperatorGroupModel, CatalogSourceConfigModel, SubscriptionModel} from '../../models';
import {MarketplaceTileView} from './marketplace-items';
import {PackageManifestKind, OperatorGroupKind, SubscriptionKind} from '../operator-lifecycle-manager';
import {MARKETPLACE_CSC_NAME} from './index';
import * as operatorImg from '../../imgs/operator.svg';

const normalizePackageManifests = (packageManifests: PackageManifestKind[] = []) => {
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
      kind: PackageManifestModel.kind,
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
    };
  });
};

export const MarketplaceList: React.SFC<MarketplaceListProps> = (props) => {
  const {packageManifest, loaded, loadError} = props;
  const catalogSourceConfig = _.find(props.catalogSourceConfig.data, csc => csc.metadata.name === MARKETPLACE_CSC_NAME);
  const items = loaded
    ? _.sortBy(normalizePackageManifests(_.get(packageManifest, 'data')), 'name')
    : [];

  return <StatusBox
    data={items}
    loaded={loaded}
    loadError={loadError}
    label="Resources"
    EmptyMsg={() => <MsgBox
      title="No Marketplace Items Found"
      detail={<span>Please check that the Marketplace operator is running and that you have created a valid OperatorSource. For more information about Marketplace, please click <a href="https://github.com/operator-framework/operator-marketplace">here</a>.</span>} />}>
    <MarketplaceTileView items={items} catalogSourceConfig={catalogSourceConfig} subscriptions={props.subscription.data} />
  </StatusBox>;
};

export const MarketplacePage: React.SFC<MarketplacePageProps> = (props) => {
  return <React.Fragment>
    <Helmet>
      <title>Marketplace</title>
    </Helmet>
    <div className="co-catalog">
      <PageHeading title="Marketplace" />
      <div className="co-catalog-connect">
        <Firehose resources={[{
          isList: true,
          kind: referenceForModel(CatalogSourceConfigModel),
          namespace: 'openshift-operators',
          prop: 'catalogSourceConfig',
        }, {
          isList: true,
          kind: referenceForModel(OperatorGroupModel),
          namespace: 'openshift-operators',
          prop: 'operatorGroup',
        }, {
          isList: true,
          kind: referenceForModel(PackageManifestModel),
          namespace: 'openshift-operators',
          prop: 'packageManifest',
          selector: {matchLabels: {'openshift-marketplace': 'true'}},
        }, {
          isList: true,
          kind: referenceForModel(SubscriptionModel),
          namespace: 'openshift-operators',
          prop: 'subscription',
        }]}>
          {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
          <MarketplaceList {...props as any} />
        </Firehose>
      </div>
    </div>
  </React.Fragment>;
};

export type MarketplacePageProps = {

};

export type MarketplaceListProps = {
  catalogSourceConfig: {loaded: boolean, data?: K8sResourceKind[]};
  operatorGroup: {loaded: boolean, data?: OperatorGroupKind[]};
  packageManifest: {loaded: boolean, data?: PackageManifestKind[]};
  subscription: {loaded: boolean, data?: SubscriptionKind[]};
  loaded: boolean;
  loadError?: string;
};

MarketplacePage.displayName = 'MarketplacePage';
MarketplaceList.displayName = 'MarketplaceList';
