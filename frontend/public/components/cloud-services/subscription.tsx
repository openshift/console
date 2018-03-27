/* eslint-disable no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Link, match } from 'react-router-dom';

import { MultiListPage, List, ListHeader, ColHead } from '../factory';
import { MsgBox, ResourceLink, ResourceCog } from '../utils';
import { ClusterServiceVersionLogo, SubscriptionKind, ClusterServiceVersionKind, SubscriptionState } from './index';
import { referenceForModel, k8sKill } from '../../module/k8s';
import { SubscriptionModel, ClusterServiceVersionModel, CatalogSourceModel } from '../../models';
import { createDisableApplicationModal } from '../modals/disable-application-modal';
import { registerTemplate } from '../../yaml-templates';

registerTemplate(`${SubscriptionModel.apiVersion}.${SubscriptionModel.kind}`, `
  apiVersion: ${SubscriptionModel.apiGroup}/${SubscriptionModel.apiVersion}
  kind: ${SubscriptionModel.kind},
  metadata:
    generateName: example-
    namespace: default
  spec:
    source: tectonic-ocs
    name: example
    channel: alpha
`);

const subscriptionState = (state: SubscriptionState) => {
  switch (state) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable: return <span><i className="fa fa-exclamation-triangle text-warning" /> Upgrade available</span>;
    case SubscriptionState.SubscriptionStateUpgradePending: return <span><i className="fa fa-spin fa-circle-o-notch co-catalog-spinner--downloading" /> Upgrading</span>;
    case SubscriptionState.SubscriptionStateAtLatest: return <span><i className="fa fa-check-circle" style={{color: '#2ec98e'}} /> Up to date</span>;
    default: return <span className={_.isEmpty(state) && 'text-muted'}>{state || 'Unknown'}</span>;
  }
};

export const SubscriptionDetails: React.SFC<SubscriptionDetailsProps> = (props) => {
  return <div className="co-m-pane__body">
    <div>
      <dl>
        <dt>Status</dt>
        <dd>{subscriptionState(_.get(props.obj.status, 'state'))}</dd>
      </dl>
      <dl>
        <dt>Channel</dt>
        <dd>{props.obj.spec.channel}</dd>
      </dl>
      <dl>
        <dt>Approval Strategy</dt>
        <dd>Automatic</dd>
      </dl>
    </div>
  </div>;
};

export const SubscriptionHeader: React.SFC<SubscriptionHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-md-3" sortField="spec.name">Package</ColHead>
  <ColHead {...props} className="col-md-2" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-2">Status</ColHead>
  <ColHead {...props} className="col-md-2">Channel</ColHead>
  <ColHead {...props} className="col-md-2">Approval Strategy</ColHead>
</ListHeader>;

export const SubscriptionRow: React.SFC<SubscriptionRowProps> = (props) => {
  const disableAction = () => ({
    label: 'Remove Subscription...',
    callback: () => createDisableApplicationModal({k8sKill, subscription: props.obj}),
  });

  return <div className="row co-resource-list__item" style={{display: 'flex', alignItems: 'center'}}>
    <div className="col-md-3" style={{display: 'flex', alignItems: 'center'}}>
      <ResourceCog actions={[disableAction]} kind={referenceForModel(SubscriptionModel)} resource={props.obj} />
      { props.csv
        ? <Link to={`/k8s/ns/${props.obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${props.csv.metadata.name}`}>
          <ClusterServiceVersionLogo displayName={props.csv.spec.displayName} icon={_.get(props.csv.spec, 'icon[0]')} provider={props.csv.spec.provider} />
        </Link>
        : <span>{props.obj.spec.name}</span> }
    </div>
    <div className="col-md-2" style={{display: 'flex', alignItems: 'center'}}>
      <ResourceLink kind="Namespace" name={props.obj.metadata.namespace} title={props.obj.metadata.namespace} displayName={props.obj.metadata.namespace} />
    </div>
    <div className="col-md-2" style={{display: 'flex', alignItems: 'center'}}>
      {subscriptionState(_.get(props.obj.status, 'state'))}
    </div>
    <div className="col-md-2" style={{display: 'flex', alignItems: 'center'}}>
      {/* TODO(alecmerdler): Make this a link for configuring channel */}
      {props.obj.spec.channel}
    </div>
    <div className="col-md-2" style={{display: 'flex', alignItems: 'center'}}>
      {/* TODO(alecmerdler): Make this a link for configuring approval */}
      Automatic
    </div>
  </div>;
};

export const SubscriptionsList: React.SFC<SubscriptionsListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Subscriptions Found" detail="Each namespace can subscribe to a single channel for automatic updates." />;
  return <List
    {...props}
    Row={(rowProps) => <SubscriptionRow {...rowProps} csv={props[referenceForModel(ClusterServiceVersionModel)].data.find(({metadata}) => metadata.name === _.get(rowProps.obj, 'status.installedCSV'))} />}
    Header={SubscriptionHeader}
    label="Subscriptions"
    EmptyMsg={EmptyMsg} />;
};

export const SubscriptionsPage: React.SFC<SubscriptionsPageProps> = (props) => <MultiListPage
  {...props}
  title="Subscriptions"
  showTitle={true}
  canCreate={true}
  createProps={{to: props.match.params.ns ? `/k8s/ns/${props.match.params.ns}/${CatalogSourceModel.plural}` : `/k8s/all-namespaces/${CatalogSourceModel.plural}`}}
  createButtonText="New Subscription"
  ListComponent={SubscriptionsList}
  filterLabel="Subscriptions by package"
  flatten={resources => _.flatMap(_.filter(resources, (v, k: string) => k === referenceForModel(SubscriptionModel)), (resource: any) => resource.data)}
  resources={[
    {kind: referenceForModel(SubscriptionModel), isList: true, namespaced: true},
    {kind: referenceForModel(ClusterServiceVersionModel), isList: true, namespaced: true},
  ]} />;

export type SubscriptionDetailsProps = {
  obj: SubscriptionKind;
  installedCSV: ClusterServiceVersionKind;
};

export type SubscriptionsPageProps = {
  packageName: string;
  match: match<{ns?: string}>;
};

export type SubscriptionsListProps = {
  data: SubscriptionKind[];
  loaded: boolean;
};

export type SubscriptionHeaderProps = {

};

export type SubscriptionRowProps = {
  obj: SubscriptionKind;
  csv: ClusterServiceVersionKind;
};

SubscriptionHeader.displayName = 'SubscriptionHeader';
SubscriptionRow.displayName = 'SubscriptionRow';
SubscriptionsList.displayName = 'SubscriptionsList';
SubscriptionsPage.displayName = 'SubscriptionsPage';
