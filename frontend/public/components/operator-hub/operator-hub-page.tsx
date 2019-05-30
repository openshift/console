import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { match } from 'react-router';

import { Firehose, PageHeading, StatusBox, MsgBox, ExternalLink, withFallback } from '../utils';
import { ErrorBoundaryFallback } from '../error';
import { referenceForModel, K8sResourceKind } from '../../module/k8s';
import { PackageManifestModel, OperatorGroupModel, CatalogSourceConfigModel, SubscriptionModel } from '../../models';
import { getOperatorProviderType } from './operator-hub-utils';
import { OperatorHubTileView } from './operator-hub-items';
import { PackageManifestKind, OperatorGroupKind, SubscriptionKind } from '../operator-lifecycle-manager';
import { installedFor, subscriptionFor } from '../operator-lifecycle-manager/operator-group';
import { OPERATOR_HUB_CSC_BASE } from '../../const';
import { OperatorHubItem, OperatorHubCSVAnnotations } from './index';
import { skeletonCatalog } from '../catalog/catalog-page';

import * as operatorImg from '../../imgs/operator.svg';

export const OperatorHubList: React.SFC<OperatorHubListProps> = (props) => {
  const {catalogSourceConfig, operatorGroup, subscription, loaded, loadError, namespace = ''} = props;
  const sourceConfigs = _.find(_.get(catalogSourceConfig, 'data'), csc => _.startsWith(csc.metadata.name, OPERATOR_HUB_CSC_BASE));
  const items = _.get(props.packageManifest, 'data', [] as PackageManifestKind[]).map(pkg => {
    const currentCSVDesc = _.get(pkg, 'status.channels[0].currentCSVDesc', {});
    const currentCSVAnnotations: OperatorHubCSVAnnotations = _.get(currentCSVDesc, 'annotations', {});
    const iconObj = _.get(currentCSVDesc, 'icon[0]');

    return {
      obj: pkg,
      kind: PackageManifestModel.kind,
      name: _.get(currentCSVDesc, 'displayName', pkg.metadata.name),
      uid: `${pkg.metadata.name}-${pkg.status.catalogSourceNamespace}`,
      installed: installedFor(subscription.data)(operatorGroup.data)(pkg.status.packageName)(namespace),
      subscription: subscriptionFor(subscription.data)(operatorGroup.data)(pkg.status.packageName)(namespace),
      // FIXME: Just use `installed`
      installState: installedFor(subscription.data)(operatorGroup.data)(pkg.status.packageName)(namespace) ? 'Installed' : 'Not Installed',
      imgUrl: iconObj ? `data:${iconObj.mediatype};base64,${iconObj.base64data}` : operatorImg,
      description: currentCSVAnnotations.description || currentCSVDesc.description,
      longDescription: currentCSVDesc.description || currentCSVAnnotations.description,
      provider: _.get(pkg, 'status.provider.name', _.get(pkg, 'metadata.labels.provider')),
      providerType: getOperatorProviderType(pkg),
      tags: pkg.metadata.tags,
      version: _.get(currentCSVDesc, 'version'),
      categories: currentCSVAnnotations.categories && _.map(currentCSVAnnotations.categories.split(','), category => category.trim()),
      catalogSource: _.get(pkg, 'status.catalogSource'),
      catalogSourceNamespace: _.get(pkg, 'status.catalogSourceNamespace'),
      ..._.pick(currentCSVAnnotations, [
        'certifiedLevel',
        'healthIndex',
        'repository',
        'containerImage',
        'createdAt',
        'support',
      ]),
      capabilityLevel: currentCSVDesc.annotations.capabilities,
    } as OperatorHubItem;
  });

  return <StatusBox
    skeleton={skeletonCatalog}
    data={items}
    loaded={loaded}
    loadError={loadError}
    label="Resources"
    EmptyMsg={() => (
      <MsgBox
        title="No OperatorHub Items Found"
        detail={<span>Please check that the OperatorHub is running and that you have created a valid OperatorSource. For more information about OperatorHub, please click <ExternalLink href="https://github.com/operator-framework/operator-marketplace" text="here" />.</span>}
      />
    )}>
    <OperatorHubTileView items={items} catalogSourceConfig={sourceConfigs} namespace={namespace} />
  </StatusBox>;
};

export const OperatorHubPage = withFallback((props: OperatorHubPageProps) => <React.Fragment>
  <Helmet>
    <title>OperatorHub</title>
  </Helmet>
  <div className="co-catalog">
    <PageHeading title="OperatorHub" />
    <p className="co-catalog-page__description">Discover Operators from the Kubernetes community and Red Hat partners, curated by Red Hat.
    Operators can be installed on your clusters to provide optional add-ons and shared services to your developers.
    Once installed, the capabilities provided by the Operator appear in the <a href="/catalog">Developer Catalog</a>,
    providing a self-service experience.</p>
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
        <OperatorHubList {...props as any} namespace={props.match.params.ns} />
      </Firehose>
    </div>
  </div>
</React.Fragment>, ErrorBoundaryFallback);

export type OperatorHubPageProps = {
  match: match<{ns?: string}>;
};

export type OperatorHubListProps = {
  namespace?: string;
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

OperatorHubList.displayName = 'OperatorHubList';
OperatorHubPage.displayName = 'OperatorHubPage';
