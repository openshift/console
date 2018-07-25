/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { safeLoad } from 'js-yaml';

import { NavTitle, Firehose, MsgBox, LoadingBox, withFallback } from '../utils';
import { CreateYAML } from '../create-yaml';
import { ClusterServiceVersionLogo, SubscriptionKind, CatalogSourceKind, ClusterServiceVersionKind, Package } from './index';
import { SubscriptionModel, CatalogSourceModel } from '../../models';
import { referenceForModel, K8sResourceKind, apiVersionForModel } from '../../module/k8s';
import { List, ListHeader, ColHead } from '../factory';
import { registerTemplate } from '../../yaml-templates';

export const PackageHeader: React.SFC<PackageHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6">Name</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs">Latest Version</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6">Subscriptions</ColHead>
</ListHeader>;

export const PackageRow: React.SFC<PackageRowProps> = (props) => {
  const {obj, catalogSource, currentCSV, namespace, allPkgSubscriptions = []} = props;
  const {displayName, icon = [], version} = currentCSV.spec;

  const channel = !_.isEmpty(obj.defaultChannel) ? obj.channels.find(ch => ch.name === obj.defaultChannel) : obj.channels[0];
  const subscriptions = allPkgSubscriptions.filter(sub => sub.metadata.namespace === namespace || _.isEmpty(namespace));

  return <div className="row co-resource-list__item" style={{display: 'flex', alignItems: 'center'}}>
    <div className="col-sm-4 col-xs-6">
      <ClusterServiceVersionLogo displayName={displayName} icon={_.get(icon, '[0]')} provider={catalogSource.spec.publisher} />
    </div>
    <div className="col-xs-4 hidden-xs">{version} ({channel.name})</div>
    <div className="col-sm-4 col-xs-6" style={{display: 'flex', justifyContent: 'space-between'}}>
      { subscriptions.length > 0
        ? <Link to={`/k8s/${_.isEmpty(namespace) ? 'all-namespaces' : `ns/${_.get(subscriptions[0], 'metadata.namespace')}`}/${SubscriptionModel.plural}?name=${subscriptions[0].spec.name}`}>
          { subscriptions.length > 1 ? `View ${subscriptions.length} subscriptions` : 'View subscription' }
        </Link>
        : <span className="text-muted hidden-xs">Not subscribed</span> }
      { _.isEmpty(namespace) || subscriptions.length === 0
        ? <Link to={`/k8s/${_.isEmpty(namespace) ? 'all-namespaces' : `ns/${namespace}`}/${CatalogSourceModel.plural}/tectonic-ocs/${obj.packageName}/subscribe`}>
          <button className="btn btn-primary">Subscribe</button>
        </Link>
        : <div /> }
    </div>
  </div>;
};

export const PackageList: React.SFC<PackageListProps> = (props) => <List
  loaded={true}
  data={props.packages.map(pkg => ({...pkg, rowKey: pkg.packageName}))}
  Header={PackageHeader}
  Row={(rowProps: {obj: Package}) => <PackageRow
    obj={rowProps.obj}
    currentCSV={props.csvFor(rowProps.obj.channels[0].currentCSV)}
    catalogSource={props.catalogSource}
    allPkgSubscriptions={props.subscriptionsFor(rowProps.obj.packageName)}
    namespace={props.namespace} />}
  label="Packages"
  EmptyMsg={() => <MsgBox title="No Packages Found" detail="The catalog author has not added any packages." />} />;

export const CatalogSourceDetails: React.SFC<CatalogSourceDetailsProps> = ({catalogSource, configMap, subscription, ns}) => {
  const packages = _.get(configMap, 'data.data.packages') ? safeLoad(_.get(configMap, 'data.data.packages')) : [];
  const csvs: ClusterServiceVersionKind[] = _.get(configMap, 'data.data.clusterServiceVersions') ? safeLoad(_.get(configMap, 'data.data.clusterServiceVersions')) : [];

  const csvFor = (name: string) => csvs.find(({metadata}) => metadata.name === name);
  const subscriptionsFor = (pkgName: string) => subscription.loaded ? subscription.data.filter(sub => sub.spec.name === pkgName) : [];

  return catalogSource.loaded && configMap.loaded && subscription.loaded ?
    <div className="co-catalog-details co-m-pane">
      <div className="co-m-pane__body">
        <div className="col-xs-4">
          <dl className="co-m-pane__details">
            <dt>Name</dt>
            <dd>{catalogSource.data.spec.displayName}</dd>
          </dl>
        </div>
        <div className="col-xs-4">
          <dl className="co-m-pane__details">
            <dt>Publisher</dt>
            <dd>{catalogSource.data.spec.publisher}</dd>
          </dl>
        </div>
      </div>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-xs-12">
            <h2>Applications</h2>
          </div>
        </div>
        <div style={{marginTop: '15px'}}>
          <PackageList packages={packages} namespace={ns} catalogSource={catalogSource.data} subscriptionsFor={subscriptionsFor} csvFor={csvFor} />
        </div>
      </div>
    </div>
    : <div />;
};

export const CatalogSourceDetailsPage: React.SFC<CatalogSourceDetailsPageProps> = (props) => <div>
  <Helmet>
    <title>Open Cloud Services</title>
  </Helmet>
  <NavTitle detail={true} title="Open Cloud Services" />
  <Firehose
    {...props}
    resources={[{
      kind: referenceForModel(CatalogSourceModel),
      name: 'tectonic-ocs',
      namespace: 'operator-lifecycle-manager',
      isList: false,
      prop: 'catalogSource',
    }, {
      kind: referenceForModel(SubscriptionModel),
      isList: true,
      prop: 'subscription',
    }, {
      kind: 'ConfigMap',
      isList: false,
      name: 'tectonic-ocs',
      namespace: 'operator-lifecycle-manager',
      prop: 'configMap'}]}>
    {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
    <CatalogSourceDetails {...props as any} ns={props.match.params.ns} />
  </Firehose>
</div>;

export const CreateSubscriptionYAML: React.SFC<CreateSubscriptionYAMLProps> = (props) => {
  type CreateProps = {ConfigMap: {loaded: boolean, data: K8sResourceKind}};
  const Create = withFallback<CreateProps>((createProps) => {
    if (createProps.ConfigMap.loaded && createProps.ConfigMap.data) {
      const pkg: Package = (_.get(createProps.ConfigMap.data, 'data.packages') ? safeLoad(_.get(createProps.ConfigMap.data, 'data.packages')) : [])
        .find(({packageName}) => packageName === props.match.params.pkgName);
      const channel = _.get(pkg, 'channels[0]');

      registerTemplate(`${apiVersionForModel(SubscriptionModel)}.${SubscriptionModel.kind}`, `
        apiVersion: ${SubscriptionModel.apiGroup}/${SubscriptionModel.apiVersion}
        kind: ${SubscriptionModel.kind},
        metadata:
          generateName: ${pkg.packageName}-
          namespace: default
        spec:
          source: tectonic-ocs
          name: ${pkg.packageName}
          startingCSV: ${channel.currentCSV}
          channel: ${channel.name}
      `);
      return <CreateYAML {...props as any} plural={SubscriptionModel.plural} />;
    }
    return <LoadingBox />;
  }, () => <MsgBox title="Package Not Found" detail="Cannot create a Subscription to a non-existent package." />);

  return <Firehose resources={[{
    kind: 'ConfigMap',
    isList: false,
    name: 'tectonic-ocs',
    namespace: 'operator-lifecycle-manager',
    prop: 'ConfigMap'
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
  allPkgSubscriptions: SubscriptionKind[];
  namespace: string;
};

export type PackageListProps = {
  packages: Package[];
  catalogSource: CatalogSourceKind;
  namespace: string;
  csvFor: (name: string) => ClusterServiceVersionKind | null;
  subscriptionsFor: (pkgName: string) => SubscriptionKind[];
};

export type CatalogSourceDetailsProps = {
  catalogSource?: {loaded: boolean, data: CatalogSourceKind, loadError: Object | string};
  configMap: {loaded: boolean, data: {data: {packages: string}}, loadError: Object | string};
  subscription: {loaded: boolean, data: SubscriptionKind[], loadError: Object | string};
  ns: string;
};

export type CatalogSourceDetailsPageProps = {
  match: match<{ns?: string}>;
};

export type CreateSubscriptionYAMLProps = {
  match: match<{ns: string, pkgName: string}>
};

PackageHeader.displayName = 'PackageHeader';
PackageRow.displayName = 'PackageRow';
PackageList.displayName = 'PackageList';
CatalogSourceDetails.displayName = 'CatalogSourceDetails';
CatalogSourceDetailsPage.displayName = 'CatalogSourceDetailPage';
CreateSubscriptionYAML.displayName = 'CreateSubscriptionYAML';
