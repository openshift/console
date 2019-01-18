/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import {Helmet} from 'react-helmet';

import { Firehose, PageHeading, StatusBox, MsgBox } from '../utils';
import { referenceForModel, K8sResourceKind } from '../../module/k8s';
import { PackageManifestModel, OperatorGroupModel, CatalogSourceConfigModel, SubscriptionModel } from '../../models';
import { getOperatorProviderType } from './operator-hub-utils';
import { OperatorHubTileView } from './operator-hub-items';
import { PackageManifestKind, OperatorGroupKind, SubscriptionKind } from '../operator-lifecycle-manager';
import { OPERATOR_HUB_CSC_BASE } from '../../const';
import * as operatorImg from '../../imgs/operator.svg';

const normalizePackageManifests = (packageManifests: PackageManifestKind[] = [], subscriptions: SubscriptionKind[]) => {
  const activePackageManifests = _.filter(packageManifests, packageManifest => {
    return !packageManifest.status.removedFromBrokerCatalog;
  });
  return _.map(activePackageManifests, packageManifest => {
    const currentCSVDesc = _.get(packageManifest, 'status.channels[0].currentCSVDesc', {});
    const currentCSVAnnotations = _.get(currentCSVDesc, 'annotations', {});
    const iconObj = _.get(currentCSVDesc, 'icon[0]');
    const installed = (subscriptions || []).some(sub => sub.spec.name === _.get(packageManifest, 'status.packageName'));

    return {
      obj: packageManifest,
      kind: PackageManifestModel.kind,
      name: _.get(currentCSVDesc, 'displayName', packageManifest.metadata.name),
      uid: `${packageManifest.metadata.name}/${packageManifest.status.catalogSourceNamespace}`,
      installed,
      installState: installed ? 'Installed' : 'Not Installed',
      imgUrl: iconObj ? `data:${iconObj.mediatype};base64,${iconObj.base64data}` : operatorImg,
      description: currentCSVAnnotations.description || currentCSVDesc.description,
      longDescription: currentCSVDesc.description || currentCSVAnnotations.description,
      provider: _.get(packageManifest, 'metadata.labels.provider'),
      providerType: getOperatorProviderType(packageManifest),
      tags: packageManifest.metadata.tags,
      version: _.get(currentCSVDesc, 'version'),
      categories: currentCSVAnnotations.categories && _.map(currentCSVAnnotations.categories.split(','), category => category.trim()),
      catalogSource: _.get(packageManifest, 'status.catalogSource'),
      catalogSourceNamespace: _.get(packageManifest, 'status.catalogSourceNamespace'),
      ..._.pick(currentCSVAnnotations, [
        'certifiedLevel',
        'healthIndex',
        'repository',
        'containerImage',
        'createdAt',
        'support',
      ]),
    };
  });
};

export class OperatorHubList extends React.Component<OperatorHubListProps, OperatorHubListState> {
  state = {items: []};

  componentDidMount() {
    const {packageManifest, subscription, loaded} = this.props;

    if (loaded) {
      const items = _.sortBy(normalizePackageManifests(_.get(packageManifest, 'data'), subscription.data), 'name');
      this.setState({items});
    }
  }

  componentDidUpdate(prevProps: OperatorHubListProps) {
    const {packageManifest, subscription, loaded} = this.props;

    if (loaded && !prevProps.loaded ||
      !_.isEqual(subscription.data, prevProps.subscription.data) ||
      !_.isEqual(packageManifest.data, prevProps.packageManifest.data)) {
      const items = _.sortBy(normalizePackageManifests(_.get(packageManifest, 'data'), subscription.data), 'name');
      this.setState({items});
    }
  }

  render() {
    const {catalogSourceConfig, loaded, loadError} = this.props;
    const {items} = this.state;
    const sourceConfigs = _.find(_.get(catalogSourceConfig, 'data'), csc => _.startsWith(csc.metadata.name, OPERATOR_HUB_CSC_BASE));

    return (
      <StatusBox
        data={items}
        loaded={loaded}
        loadError={loadError}
        label="Resources"
        EmptyMsg={() => (
          <MsgBox
            title="No Operator Hub Items Found"
            detail={
              <span>
                Please check that the OperatorHub is running and that you have created a valid OperatorSource. For more information about Operator Hub,
                please click <a href="https://github.com/operator-framework/operator-marketplace" target="_blank" className="co-external-link" rel="noopener noreferrer">here</a>.
              </span>
            }
          />
        )}>
        <OperatorHubTileView items={items} catalogSourceConfig={sourceConfigs} />
      </StatusBox>
    );
  }
}

export const OperatorHubPage: React.SFC<OperatorHubPageProps> = (props) => {
  return <React.Fragment>
    <Helmet>
      <title>Operator Hub</title>
    </Helmet>
    <div className="co-catalog">
      <PageHeading title="Operator Hub" />
      <div className="co-catalog-connect">
        <Firehose resources={[{
          isList: true,
          kind: referenceForModel(CatalogSourceConfigModel),
          namespace: 'openshift-marketplace',
          prop: 'catalogSourceConfig',
        }, {
          isList: true,
          kind: referenceForModel(OperatorGroupModel),
          prop: 'operatorGroup',
        }, {
          isList: true,
          kind: referenceForModel(PackageManifestModel),
          namespace: 'openshift-marketplace',
          prop: 'packageManifest',
          selector: {matchLabels: {'openshift-marketplace': 'true'}},
        }, {
          isList: true,
          kind: referenceForModel(SubscriptionModel),
          prop: 'subscription',
        }]}>
          {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
          <OperatorHubList {...props as any} />
        </Firehose>
      </div>
    </div>
  </React.Fragment>;
};

export type OperatorHubPageProps = {

};

export type OperatorHubListProps = {
  catalogSourceConfig: {loaded: boolean, data?: K8sResourceKind[]};
  operatorGroup: {loaded: boolean, data?: OperatorGroupKind[]};
  packageManifest: {loaded: boolean, data?: PackageManifestKind[]};
  subscription: {loaded: boolean, data?: SubscriptionKind[]};
  loaded: boolean;
  loadError?: string;
};

export type OperatorHubListState = {
  items: any[];
};

OperatorHubPage.displayName = 'OperatorHubPage';
