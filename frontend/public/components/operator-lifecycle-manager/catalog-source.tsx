/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match, Link } from 'react-router-dom';
import { safeLoad } from 'js-yaml';

import { SectionHeading, Firehose, MsgBox, LoadingBox, ResourceCog, ResourceLink, Cog, navFactory, resourceObjPath, Timestamp, StatusBox } from '../utils';
import { withFallback } from '../utils/error-boundary';
import { CreateYAML } from '../create-yaml';
import { ClusterServiceVersionLogo, CatalogSourceKind, ClusterServiceVersionKind, Package, SubscriptionKind, olmNamespace } from './index';
import { SubscriptionModel, CatalogSourceModel, ConfigMapModel } from '../../models';
import { referenceForModel, K8sResourceKind, ConfigMapKind } from '../../module/k8s';
import { List, ListHeader, ColHead, ResourceRow, DetailsPage, MultiListPage } from '../factory';
import { getActiveNamespace } from '../../ui/ui-actions';
import { ALL_NAMESPACES_KEY } from '../../const';

type ConfigMapFor = (data: {data?: ConfigMapKind[]}) => (name: string) => ConfigMapKind;
const configMapFor: ConfigMapFor = data => name => _.get(data, 'data', [] as ConfigMapKind[]).find(cm => cm.metadata.name === name);

type SubscriptionsFor = (subs: SubscriptionKind[]) => (obj: CatalogSourceKind) => SubscriptionKind[];
const subscriptionsFor: SubscriptionsFor = subs => obj => subs.filter(sub => sub.spec.source === obj.metadata.name);

type PackagesFor = (configMap: ConfigMapKind) => Package[];
const packagesFor: PackagesFor = configMap => _.get(configMap, 'data.packages')
  ? safeLoad(_.get(configMap, 'data.packages', ''))
  : [];

type ClusterServiceVersionsFor = (configMap: ConfigMapKind) => ClusterServiceVersionKind[];
const clusterServiceVersionsFor: ClusterServiceVersionsFor = configMap => _.get(configMap, 'data.clusterServiceVersions')
  ? safeLoad(_.get(configMap, 'data.clusterServiceVersions', ''))
  : [];

export const PackageHeader: React.SFC<PackageHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6">Name</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs">Latest Version</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6">Subscriptions</ColHead>
</ListHeader>;

export const PackageRow: React.SFC<PackageRowProps> = (props) => {
  const {obj, catalogSource, currentCSV, subscription} = props;
  const {displayName, icon = [], version, provider} = currentCSV.spec;
  const ns = getActiveNamespace();
  const channel = !_.isEmpty(obj.defaultChannel) ? obj.channels.find(ch => ch.name === obj.defaultChannel) : obj.channels[0];

  const subscriptionLink = () => ns !== ALL_NAMESPACES_KEY
    ? <Link to={`/k8s/ns/${ns}/${SubscriptionModel.plural}/${subscription.metadata.name}`}>View subscription</Link>
    : <Link to={`/k8s/all-namespaces/${SubscriptionModel.plural}?name=${obj.packageName}`}>View subscriptions</Link>;

  const createSubscriptionLink = () => `/k8s/ns/${ns === ALL_NAMESPACES_KEY ? 'default' : ns}/${SubscriptionModel.plural}/new?pkg=${obj.packageName}&catalog=${catalogSource.metadata.name}&catalogNamespace=${catalogSource.metadata.namespace}`;

  return <div className="row co-resource-list__item co-package-row">
    <div className="col-sm-4 col-xs-6">
      <ClusterServiceVersionLogo displayName={displayName} icon={_.get(icon, '[0]')} provider={provider.name} />
    </div>
    <div className="col-xs-4 hidden-xs">{version} ({channel.name})</div>
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

export const PackageList: React.SFC<PackageListProps> = (props) => <List
  loaded={true}
  // TODO(alecmerdler): Adding `metadata` as a hack to get text filter to work until `Package` is a real k8s resource
  data={props.packages.map(pkg => ({...pkg, rowKey: pkg.packageName, metadata: {name: pkg.packageName}}))}
  filters={props.filters}
  Header={PackageHeader}
  Row={(rowProps: {obj: Package}) => <PackageRow
    obj={rowProps.obj}
    currentCSV={props.clusterServiceVersions.find(({metadata}) => metadata.name === rowProps.obj.channels[0].currentCSV)}
    catalogSource={props.catalogSource}
    subscription={props.subscriptions.find(sub => sub.spec.name === rowProps.obj.packageName)} />}
  label="Packages"
  EmptyMsg={() => <MsgBox title="No Packages Found" detail="The catalog author has not added any packages." />} />;

export const CatalogSourceDetails = withFallback<CatalogSourceDetailsProps>(({obj, configMap, subscription}) => {
  const packages = packagesFor(configMap) || [];
  const clusterServiceVersions = clusterServiceVersionsFor(configMap) || [];
  const subscriptions = subscriptionsFor(_.get(subscription, 'data', []))(obj);

  return !_.isEmpty(obj) && !_.isEmpty(configMap)
    ? <div className="co-catalog-details co-m-pane">
      <div className="co-m-pane__body">
        <div className="col-xs-4">
          <dl className="co-m-pane__details">
            <dt>Name</dt>
            <dd>{obj.spec.displayName}</dd>
          </dl>
        </div>
        <div className="col-xs-4">
          <dl className="co-m-pane__details">
            <dt>Publisher</dt>
            <dd>{obj.spec.publisher}</dd>
          </dl>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Packages" />
        <PackageList packages={packages} catalogSource={obj} clusterServiceVersions={clusterServiceVersions} subscriptions={subscriptions} />
      </div>
    </div>
    : <div />;
}, () => <MsgBox title="Error Parsing Catalog" detail="The contents of the catalog source could not be retrieved." />);

export const CatalogSourceHeader: React.SFC<CatalogSourceHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-md-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-2" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-2" sortField="spec.publisher">Publisher</ColHead>
  <ColHead {...props} className="col-md-2">Created</ColHead>
</ListHeader>;

export const CatalogSourceRow: React.SFC<CatalogSourceRowProps> = (props) => <ResourceRow obj={props.obj}>
  <div className="col-md-3 co-resource-link-wrapper">
    <ResourceCog actions={Cog.factory.common} kind={referenceForModel(CatalogSourceModel)} resource={props.obj} />
    <ResourceLink kind={referenceForModel(CatalogSourceModel)} namespace={props.obj.metadata.namespace} name={props.obj.metadata.name} title={props.obj.metadata.uid} />
  </div>
  <div className="col-md-2">
    <ResourceLink kind="Namespace" name={props.obj.metadata.namespace} title={props.obj.metadata.namespace} displayName={props.obj.metadata.namespace} />
  </div>
  <div className="col-md-2">{props.obj.spec.publisher}</div>
  <div className="col-md-2"><Timestamp timestamp={props.obj.metadata.creationTimestamp} /></div>
</ResourceRow>;

export const CatalogSourceList = withFallback((props: CatalogSourceListProps) => {
  const cmFor = configMapFor({data: [..._.get(props.configMap, 'data', []), ..._.get(props.globalConfigMap, 'data', [])]});
  const pkgsFor = (obj: CatalogSourceKind) => packagesFor(cmFor(obj.spec.configMap));
  const csvsFor = (obj: CatalogSourceKind) => clusterServiceVersionsFor(cmFor(obj.spec.configMap));
  const subsFor = subscriptionsFor(_.get(props.subscription, 'data', [] as SubscriptionKind[]));

  const data = [...props.data, ..._.get(props.globalCatalogSource, 'data', [])];

  return props.loaded
    ? <React.Fragment>
      <p className="co-m-pane__explanation">Catalogs are groups of Operators you can make available on the cluster. Subscribe and grant a namespace access to use the installed Operators.</p>
      { _.isEmpty(data) && <MsgBox title="No Catalog Sources Found" detail="Catalog Sources contain packaged Operators which can be subscribed to for automatic upgrades." /> }
      {/* TODO(alecmerdler): Handle filtering based on package name */}
      { data.map((obj) => <div key={obj.metadata.uid} className="co-catalogsource-list__section">
        <div className="co-catalogsource-list__section__packages">
          <div>
            <h3>{obj.spec.displayName || obj.metadata.name}</h3>
            <span className="text-muted">Packaged by {obj.spec.publisher}</span>
          </div>
          <Link to={`/k8s/ns/${obj.metadata.namespace}/${CatalogSourceModel.plural}/${obj.metadata.name}`}>View catalog details</Link>
        </div>
        <PackageList catalogSource={obj} clusterServiceVersions={csvsFor(obj)} packages={pkgsFor(obj)} subscriptions={subsFor(obj)} filters={props.filters} />
      </div>) }
    </React.Fragment>
    : <StatusBox loaded={props.loaded} loadError={props.loadError} label={CatalogSourceModel.labelPlural} />;
}, () => <MsgBox title="Error Parsing Catalog" detail="The contents of the catalog source could not be retrieved." />);

export const CatalogSourcesPage: React.SFC<CatalogSourcePageProps> = (props) => {
  type Flatten = (resources: {[kind: string]: {data: K8sResourceKind[]}}) => K8sResourceKind[];
  const flatten: Flatten = resources => _.get(resources.catalogSource, 'data', []);

  return <MultiListPage
    {...props}
    title="Operator Catalog Sources"
    showTitle={true}
    ListComponent={CatalogSourceList}
    filterLabel="Packages by name"
    flatten={flatten}
    resources={[
      {kind: referenceForModel(CatalogSourceModel), isList: true, namespaced: true, prop: 'catalogSource'},
      {kind: ConfigMapModel.kind, isList: true, namespaced: true, prop: 'configMap'},
      // FIXME(alecmerdler): Don't hard-code catalog namespace, use the `alm-manager` annotation on the current namespace
      ...((props.namespace || olmNamespace) !== olmNamespace ? {kind: referenceForModel(CatalogSourceModel), isList: true, namespace: olmNamespace, prop: 'globalCatalogSource'} : []),
      ...((props.namespace || olmNamespace) !== olmNamespace ? {kind: ConfigMapModel.kind, isList: true, namespace: olmNamespace, prop: 'globalConfigMap'} : []),
      {kind: referenceForModel(SubscriptionModel), isList: true, namespaced: true, prop: 'subscription'},
    ]} />;
};

export const CatalogSourceDetailsPage: React.SFC<CatalogSourceDetailsPageProps> = (props) => <DetailsPage
  {...props}
  namespace={props.match.params.ns}
  kind={referenceForModel(CatalogSourceModel)}
  name={props.match.params.name}
  pages={[
    navFactory.details(CatalogSourceDetails),
    navFactory.editYaml(),
  ]}
  menuActions={[...Cog.factory.common, (kind, obj) => ({label: 'View Contents...', href: resourceObjPath(obj, ConfigMapModel.kind)})]}
  resources={[{
    kind: ConfigMapModel.kind,
    isList: false,
    namespace: props.match.params.ns,
    name: props.match.params.name,
    prop: 'configMap'
  }, {
    kind: referenceForModel(SubscriptionModel),
    isList: true,
    namespace: props.match.params.ns,
    prop: 'subscription',
  }]}
/>;

export const CreateSubscriptionYAML: React.SFC<CreateSubscriptionYAMLProps> = (props) => {
  type CreateProps = {ConfigMap: {loaded: boolean, data: K8sResourceKind}};
  const Create = withFallback<CreateProps>((createProps) => {
    if (createProps.ConfigMap.loaded && createProps.ConfigMap.data) {
      const pkg: Package = (_.get(createProps.ConfigMap.data, 'data.packages') ? safeLoad(_.get(createProps.ConfigMap.data, 'data.packages')) : [])
        .find(({packageName}) => packageName === new URLSearchParams(props.location.search).get('pkg'));
      const channel = _.get(pkg, 'channels[0]');

      const template = `
        apiVersion: ${SubscriptionModel.apiGroup}/${SubscriptionModel.apiVersion}
        kind: ${SubscriptionModel.kind},
        metadata:
          generateName: ${pkg.packageName}-
          namespace: default
        spec:
          source: ${createProps.ConfigMap.data.metadata.name}
          name: ${pkg.packageName}
          startingCSV: ${channel.currentCSV}
          channel: ${channel.name}
      `;
      return <CreateYAML {...props as any} plural={SubscriptionModel.plural} template={template} />;
    }
    return <LoadingBox />;
  }, () => <MsgBox title="Package Not Found" detail="Cannot create a Subscription to a non-existent package." />);

  return <Firehose resources={[{
    kind: ConfigMapModel.kind,
    isList: false,
    name: new URLSearchParams(props.location.search).get('catalog'),
    namespace: new URLSearchParams(props.location.search).get('catalogNamespace'),
    prop: 'ConfigMap',
  }]}>
    {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
    <Create {...props as any} />
  </Firehose>;
};

export type PackageHeaderProps = {

};

export type PackageRowProps = {
  obj: Package;
  catalogSource: CatalogSourceKind;
  currentCSV: ClusterServiceVersionKind;
  subscription?: SubscriptionKind;
};

export type PackageListProps = {
  catalogSource: CatalogSourceKind;
  packages: Package[];
  clusterServiceVersions: ClusterServiceVersionKind[];
  subscriptions: SubscriptionKind[];
  filters?: {[name: string]: string};
};

export type CatalogSourceHeaderProps = {

};

export type CatalogSourceRowProps = {
  obj: CatalogSourceKind;
};

export type CatalogSourceListProps = {
  configMap: {loaded?: boolean, data?: ConfigMapKind[]};
  globalConfigMap: {loaded?: boolean, data?: ConfigMapKind[]};
  data: CatalogSourceKind[];
  filters?: {[name: string]: string};
  globalCatalogSource: {loaded?: boolean, data?: CatalogSourceKind[]};
  subscription: {loaded?: boolean, data?: SubscriptionKind[]}
  loaded: boolean;
  loadError?: string | Object;
};

export type CatalogSourcePageProps = {
  namespace?: string;
};

export type CatalogSourceDetailsProps = {
  obj: CatalogSourceKind;
  configMap: K8sResourceKind & {data: {packages: string}};
  subscription: {loaded?: boolean, data?: SubscriptionKind[]};
};

export type CatalogSourceDetailsPageProps = {
  match: match<{ns?: string, name: string}>;
};

export type CreateSubscriptionYAMLProps = {
  match: match<{ns: string, pkgName: string}>;
  location: Location;
};

PackageHeader.displayName = 'PackageHeader';
PackageRow.displayName = 'PackageRow';
PackageList.displayName = 'PackageList';
CatalogSourceHeader.displayName = 'CatalogSourceHeader';
CatalogSourceRow.displayName = 'CatalogSourceRow';
CatalogSourceList.displayName = 'CatalogSourceList';
CatalogSourcesPage.displayName = 'CatalogSourcePage';
CatalogSourceDetails.displayName = 'CatalogSourceDetails';
CatalogSourceDetailsPage.displayName = 'CatalogSourceDetailPage';
CreateSubscriptionYAML.displayName = 'CreateSubscriptionYAML';
