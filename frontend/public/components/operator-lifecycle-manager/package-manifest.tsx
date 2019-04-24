/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Link, match } from 'react-router-dom';

import { referenceForModel, K8sResourceKind } from '../../module/k8s';
import { requireOperatorGroup, installedFor, supports } from './operator-group';
import { PackageManifestKind, SubscriptionKind, ClusterServiceVersionLogo, visibilityLabel, OperatorGroupKind, installModesFor, defaultChannelFor } from './index';
import { PackageManifestModel, SubscriptionModel, CatalogSourceModel, OperatorGroupModel } from '../../models';
import { StatusBox, MsgBox } from '../utils';
import { List, ListHeader, ColHead, MultiListPage } from '../factory';
import { getActiveNamespace } from '../../actions/ui';
import { ALL_NAMESPACES_KEY, OPERATOR_HUB_LABEL } from '../../const';

export const PackageManifestHeader: React.SFC<PackageManifestHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-md-4 col-sm-4 col-xs-6">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-4 hidden-xs">Latest Version</ColHead>
  <ColHead {...props} className="col-md-5 col-sm-4 col-xs-6">Subscriptions</ColHead>
</ListHeader>;

export const PackageManifestRow: React.SFC<PackageManifestRowProps> = (props) => {
  const {obj, catalogSourceName, catalogSourceNamespace, subscription, defaultNS, canSubscribe} = props;
  const ns = getActiveNamespace();
  const channel = !_.isEmpty(obj.status.defaultChannel) ? obj.status.channels.find(ch => ch.name === obj.status.defaultChannel) : obj.status.channels[0];
  const {displayName, icon = [], version, provider} = channel.currentCSVDesc;

  const subscriptionLink = () => ns !== ALL_NAMESPACES_KEY
    ? <Link to={`/operatormanagement/ns/${ns}?name=${subscription.metadata.name}`}>View<span className="visible-lg-inline"> subscription</span></Link>
    : <Link to={`/operatormanagement/all-namespaces?name=${obj.metadata.name}`}>View<span className="visible-lg-inline"> subscriptions</span></Link>;

  const createSubscriptionLink = () => `/k8s/ns/${ns === ALL_NAMESPACES_KEY ? defaultNS : ns}/${SubscriptionModel.plural}/~new?pkg=${obj.metadata.name}&catalog=${catalogSourceName}&catalogNamespace=${catalogSourceNamespace}`;

  return <div className="row co-resource-list__item co-package-row">
    <div className="col-md-4 col-sm-4 col-xs-6">
      <ClusterServiceVersionLogo displayName={displayName} icon={_.get(icon, '[0]')} provider={provider.name} />
    </div>
    <div className="col-md-3 col-sm-4 hidden-xs">{version} ({channel.name})</div>
    <div className="col-md-5 col-sm-4 col-xs-6 co-package-row__actions">{ subscription
      ? subscriptionLink()
      : <span className="text-muted">None</span> }
    { canSubscribe && <Link to={createSubscriptionLink()}>
      <button className="btn btn-primary">Create<span className="visible-lg-inline"> Subscription</span></button>
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
    { _.sortBy([...catalogs.values()], 'displayName').map(catalog => <div key={catalog.name} className="co-catalogsource-list__section">
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
          subscription={(props.subscription.data || [])
            .filter(sub => _.isEmpty(props.namespace) || sub.metadata.namespace === props.namespace)
            .find(sub => sub.spec.name === rowProps.obj.metadata.name)}
          canSubscribe={!installedFor(props.subscription.data)(props.operatorGroup.data)(rowProps.obj.status.packageName)(getActiveNamespace())
            && props.operatorGroup.data
              .filter(og => _.isEmpty(props.namespace) || og.metadata.namespace === props.namespace)
              .some(og => supports(installModesFor(rowProps.obj)(defaultChannelFor(rowProps.obj)))(og))}
          defaultNS={_.get(props.operatorGroup, 'data[0].metadata.namespace')} />}
        label="Package Manifests"
        EmptyMsg={() => <MsgBox title="No PackageManifests Found" detail="The catalog author has not added any packages." />} />
    </div>) }
  </StatusBox>;
});

export const PackageManifestsPage: React.SFC<PackageManifestsPageProps> = (props) => {
  const namespace = _.get(props.match, 'params.ns');
  type Flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => K8sResourceKind[];
  const flatten: Flatten = resources => _.get(resources.packageManifest, 'data', []);
  const HelpText = <p className="co-help-text">Catalogs are groups of Operators you can make available on the cluster. Subscribe and grant a namespace access to use the installed Operators.</p>;

  return <MultiListPage
    {...props}
    namespace={namespace}
    showTitle={false}
    helpText={HelpText}
    ListComponent={(listProps: PackageManifestListProps) => <PackageManifestList {...listProps} showDetailsLink={true} namespace={namespace} />}
    textFilter="packagemanifest-name"
    flatten={flatten}
    resources={[
      {kind: referenceForModel(PackageManifestModel), isList: true, namespaced: true, prop: 'packageManifest', selector: {matchExpressions: [{key: visibilityLabel, operator: 'DoesNotExist'}, {key: OPERATOR_HUB_LABEL, operator: 'DoesNotExist'}]}},
      {kind: referenceForModel(CatalogSourceModel), isList: true, namespaced: true, prop: 'catalogSource'},
      {kind: referenceForModel(SubscriptionModel), isList: true, namespaced: true, prop: 'subscription'},
      {kind: referenceForModel(OperatorGroupModel), isList: true, namespaced: true, prop: 'operatorGroup'},
    ]} />;
};

export type PackageManifestsPageProps = {
  namespace?: string;
  match?: match<{ns?: string}>;
};

export type PackageManifestListProps = {
  namespace?: string;
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
  canSubscribe: boolean;
};

PackageManifestHeader.displayName = 'PackageManifestHeader';
PackageManifestRow.displayName = 'PackageManifestRow';
PackageManifestList.displayName = 'PackageManifestList';
