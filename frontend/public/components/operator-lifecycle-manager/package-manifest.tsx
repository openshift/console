import * as React from 'react';
import * as _ from 'lodash-es';
import { Link, match } from 'react-router-dom';
import * as classNames from 'classnames';

import { referenceForModel, K8sResourceKind } from '../../module/k8s';
import { requireOperatorGroup, installedFor, supports } from './operator-group';
import { PackageManifestKind, SubscriptionKind, ClusterServiceVersionLogo, visibilityLabel, OperatorGroupKind, installModesFor, defaultChannelFor } from './index';
import { PackageManifestModel, SubscriptionModel, CatalogSourceModel, OperatorGroupModel } from '../../models';
import { StatusBox, MsgBox } from '../utils';
import { MultiListPage, Table, TableRow, TableData } from '../factory';
import { getActiveNamespace } from '../../actions/ui';
import { ALL_NAMESPACES_KEY, OPERATOR_HUB_LABEL } from '../../const';

const tableColumnClasses = [
  classNames('col-lg-4', 'col-md-4', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-5', 'col-md-5', 'col-sm-4', 'col-xs-6'),
];

export const PackageManifestTableHeader = () => [{
  title: 'Name', props: { className: tableColumnClasses[0] },
}, {
  title: 'Latest Version', props: { className: tableColumnClasses[1] },
}, {
  title: 'Subscriptions', props: { className: tableColumnClasses[2] },
}];

export const PackageManifestTableRow: React.SFC<PackageManifestTableRowProps> = (props) => {
  const {obj, catalogSourceName, catalogSourceNamespace, subscription, defaultNS, canSubscribe, index, key, style} = props;
  const ns = getActiveNamespace();
  const channel = !_.isEmpty(obj.status.defaultChannel) ? obj.status.channels.find(ch => ch.name === obj.status.defaultChannel) : obj.status.channels[0];
  const {displayName, icon = [], version, provider} = channel.currentCSVDesc;

  const subscriptionLink = () => ns !== ALL_NAMESPACES_KEY
    ? <Link to={`/operatormanagement/ns/${ns}?name=${subscription.metadata.name}`}>View<span className="visible-lg-inline"> subscription</span></Link>
    : <Link to={`/operatormanagement/all-namespaces?name=${obj.metadata.name}`}>View<span className="visible-lg-inline"> subscriptions</span></Link>;

  const createSubscriptionLink = () => `/k8s/ns/${ns === ALL_NAMESPACES_KEY ? defaultNS : ns}/${SubscriptionModel.plural}/~new?pkg=${obj.metadata.name}&catalog=${catalogSourceName}&catalogNamespace=${catalogSourceNamespace}`;

  return <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
    <TableData className={tableColumnClasses[0]}>
      <ClusterServiceVersionLogo displayName={displayName} icon={_.get(icon, '[0]')} provider={provider.name} />
    </TableData>
    <TableData className={tableColumnClasses[1]}>
      {version} ({channel.name})
    </TableData>
    <TableData className={tableColumnClasses[2]}>{ subscription
      ? subscriptionLink()
      : <span className="text-muted">None</span> }
    { canSubscribe && <Link to={createSubscriptionLink()}>
      <button className="btn btn-primary">Create<span className="visible-lg-inline"> Subscription</span></button>
    </Link> }
    </TableData>
  </TableRow>;
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
      <Table
        aria-label="Package Manifests"
        loaded={true}
        data={(props.data || []).filter(pkg => pkg.status.catalogSource === catalog.name)}
        filters={props.filters}
        Header={PackageManifestTableHeader}
        Row={(rowProps) => <PackageManifestTableRow
          obj={rowProps.obj}
          index={rowProps.index}
          key={rowProps.key}
          style={rowProps.style}
          catalogSourceName={catalog.name}
          catalogSourceNamespace={catalog.namespace}
          subscription={(props.subscription.data || [])
            .filter(sub => _.isEmpty(props.namespace) || sub.metadata.namespace === props.namespace)
            .find(sub => sub.spec.name === rowProps.obj.metadata.name)}
          canSubscribe={props.canSubscribe && !installedFor(props.subscription.data)(props.operatorGroup.data)(rowProps.obj.status.packageName)(getActiveNamespace())
            && props.operatorGroup.data
              .filter(og => _.isEmpty(props.namespace) || og.metadata.namespace === props.namespace)
              .some(og => supports(installModesFor(rowProps.obj)(defaultChannelFor(rowProps.obj)))(og))}
          defaultNS={_.get(props.operatorGroup, 'data[0].metadata.namespace')} />}
        EmptyMsg={() => <MsgBox title="No PackageManifests Found" detail="The catalog author has not added any packages." />}
        virtualize />
    </div>) }
  </StatusBox>;
});

export const PackageManifestsPage: React.SFC<PackageManifestsPageProps> = (props) => {
  const namespace = _.get(props.match, 'params.ns');
  type Flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => K8sResourceKind[];
  const flatten: Flatten = resources => _.get(resources.packageManifest, 'data', []);
  const helpText = <p className="co-help-text">Catalogs are groups of Operators you can make available on the cluster. Use <Link to="/operatorhub">OperatorHub</Link> to subscribe and grant namespaces access to use installed Operators.</p>;

  return <MultiListPage
    {...props}
    namespace={namespace}
    showTitle={false}
    helpText={helpText}
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
  canSubscribe?: boolean;
};

export type PackageManifestTableRowProps = {
  obj: PackageManifestKind;
  index: number;
  key?: string;
  style: object;
  catalogSourceName: string;
  catalogSourceNamespace: string;
  subscription?: SubscriptionKind;
  defaultNS: string;
  canSubscribe: boolean;
};

PackageManifestTableHeader.displayName = 'PackageManifestTableHeader';
PackageManifestTableRow.displayName = 'PackageManifestTableRow';
PackageManifestList.displayName = 'PackageManifestList';
