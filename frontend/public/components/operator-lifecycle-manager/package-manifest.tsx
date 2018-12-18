/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';

import { referenceForModel, K8sResourceKind } from '../../module/k8s';
import { requireOperatorGroup } from './operator-group';
import { PackageManifestKind, SubscriptionKind, ClusterServiceVersionLogo, visibilityLabel, OperatorGroupKind } from './index';
import { PackageManifestModel, SubscriptionModel, CatalogSourceModel, OperatorGroupModel } from '../../models';
import { StatusBox, MsgBox } from '../utils';
import { List, ListHeader, ColHead, MultiListPage } from '../factory';
import { getActiveNamespace } from '../../ui/ui-actions';
import { ALL_NAMESPACES_KEY, MARKETPLACE_LABEL } from '../../const';

export const PackageManifestHeader: React.SFC<PackageManifestHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6">Name</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs">Latest Version</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6">Subscriptions</ColHead>
</ListHeader>;

export const PackageManifestRow: React.SFC<PackageManifestRowProps> = (props) => {
  const {obj, catalogSourceName, catalogSourceNamespace, subscription, defaultNS} = props;
  const ns = getActiveNamespace();
  const channel = !_.isEmpty(obj.status.defaultChannel) ? obj.status.channels.find(ch => ch.name === obj.status.defaultChannel) : obj.status.channels[0];
  const {displayName, icon = [], version, provider} = channel.currentCSVDesc;

  const subscriptionLink = () => ns !== ALL_NAMESPACES_KEY
    ? <Link to={`/k8s/ns/${ns}/${SubscriptionModel.plural}/${subscription.metadata.name}`}>View subscription</Link>
    : <Link to={`/k8s/all-namespaces/${SubscriptionModel.plural}?name=${obj.metadata.name}`}>View subscriptions</Link>;

  const createSubscriptionLink = () => `/k8s/ns/${ns === ALL_NAMESPACES_KEY ? defaultNS : ns}/${SubscriptionModel.plural}/new?pkg=${obj.metadata.name}&catalog=${catalogSourceName}&catalogNamespace=${catalogSourceNamespace}`;

  return <div className="row co-resource-list__item co-package-row">
    <div className="col-sm-4 col-xs-6">
      <ClusterServiceVersionLogo displayName={displayName} icon={_.get(icon, '[0]')} provider={provider.name} />
    </div>
    <div className="col-sm-4 hidden-xs">{version} ({channel.name})</div>
    <div className="col-sm-4 col-xs-6 co-package-row__actions">
      { subscription
        ? subscriptionLink()
        : <span className="text-muted">Not subscribed</span> }
      { (!subscription || ns === ALL_NAMESPACES_KEY) && <Link to={createSubscriptionLink()}>
        <button className="btn btn-primary">Create Subscription</button>
      </Link> }
    </div>
  </div>;
};

export const PackageManifestList = requireOperatorGroup((props: PackageManifestListProps) => {
  type CatalogSourceInfo = {displayName: string, name: string, publisher: string, namespace: string};
  const catalogs = (props.data || []).reduce((allCatalogs, {status}) => allCatalogs.set(status.catalogSource, {
    displayName: status.catalogSourceDisplayName,
    name: status.catalogSource,
    publisher: status.catalogSourcePublisher,
    namespace: status.catalogSourceNamespace,
  }), new Map<string, CatalogSourceInfo>());

  return <StatusBox
    loaded={props.loaded}
    loadError={props.loadError}
    label={PackageManifestModel.labelPlural}
    data={props.data}
    EmptyMsg={() => <MsgBox title="No Package Manifests Found" detail="Package Manifests are packaged Operators which can be subscribed to for automatic upgrades." />}>
    { [...catalogs.values()].map(catalog => <div key={catalog.name} className="co-catalogsource-list__section">
      <div className="co-catalogsource-list__section__packages">
        <div>
          <h3>{catalog.displayName}</h3>
          <span className="text-muted">Packaged by {catalog.publisher}</span>
        </div>
        {props.showDetailsLink && <Link to={`/k8s/ns/${catalog.namespace}/${referenceForModel(CatalogSourceModel)}/${catalog.name}`}>View catalog details</Link>}
      </div>
      <List
        loaded={true}
        data={(props.data || []).filter(pkg => pkg.status.catalogSource === catalog.name)}
        filters={props.filters}
        virtualize={false}
        Header={PackageManifestHeader}
        Row={(rowProps: {obj: PackageManifestKind}) => <PackageManifestRow
          obj={rowProps.obj}
          catalogSourceName={catalog.name}
          catalogSourceNamespace={catalog.namespace}
          subscription={(props.subscription.data || []).find(sub => sub.spec.name === rowProps.obj.metadata.name)}
          defaultNS={_.get(props.operatorGroup, 'data[0].metadata.namespace')} />}
        label="Package Manifests"
        EmptyMsg={() => <MsgBox title="No PackageManifests Found" detail="The catalog author has not added any packages." />} />
    </div>) }
  </StatusBox>;
});

export const PackageManifestsPage: React.SFC<PackageManifestsPageProps> = (props) => {
  type Flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => K8sResourceKind[];
  const flatten: Flatten = resources => _.get(resources.packageManifest, 'data', []);
  const HelpText = <p className="co-help-text">Catalogs are groups of Operators you can make available on the cluster. Subscribe and grant a namespace access to use the installed Operators.</p>;

  return <MultiListPage
    {...props}
    title="Operator Catalog Sources"
    showTitle={true}
    helpText={HelpText}
    ListComponent={(listProps: PackageManifestListProps) => <PackageManifestList {...listProps} showDetailsLink={true} />}
    filterLabel="Packages by name"
    flatten={flatten}
    resources={[
      {kind: referenceForModel(PackageManifestModel), isList: true, namespaced: true, prop: 'packageManifest', selector: {matchExpressions: [{key: visibilityLabel, operator: 'DoesNotExist'}, {key: MARKETPLACE_LABEL, operator: 'DoesNotExist'}]}},
      {kind: referenceForModel(CatalogSourceModel), isList: true, namespaced: true, prop: 'catalogSource'},
      {kind: referenceForModel(SubscriptionModel), isList: true, namespaced: true, prop: 'subscription'},
      {kind: referenceForModel(OperatorGroupModel), isList: true, namespaced: true, prop: 'operatorGroup'},
    ]} />;
};

export type PackageManifestsPageProps = {
  namespace?: string;
};

export type PackageManifestListProps = {
  data: PackageManifestKind[];
  filters?: {[name: string]: string};
  subscription: {loaded: boolean, data?: SubscriptionKind[]};
  operatorGroup: {loaded: boolean, data?: OperatorGroupKind[]};
  loaded: boolean;
  loadError?: string | Object;
  showDetailsLink?: boolean;
};

export type PackageManifestHeaderProps = {

};

export type PackageManifestRowProps = {
  obj: PackageManifestKind;
  catalogSourceName: string;
  catalogSourceNamespace: string;
  subscription?: SubscriptionKind;
  defaultNS: string;
};

PackageManifestHeader.displayName = 'PackageManifestHeader';
PackageManifestRow.displayName = 'PackageManifestRow';
PackageManifestList.displayName = 'PackageManifestList';
