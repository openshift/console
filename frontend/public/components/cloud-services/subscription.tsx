/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match, Link } from 'react-router-dom';
import { safeLoad } from 'js-yaml';

import { MultiListPage, List, ListHeader, ColHead, DetailsPage } from '../factory';
import { MsgBox, ResourceLink, ResourceCog, navFactory, Cog, ResourceSummary, Firehose, LoadingInline } from '../utils';
import { SubscriptionKind, ClusterServiceVersionKind, SubscriptionState, Package, InstallPlanKind } from './index';
import { referenceForModel, k8sKill, k8sUpdate, K8sResourceKind } from '../../module/k8s';
import { SubscriptionModel, ClusterServiceVersionModel, CatalogSourceModel, ConfigMapModel, InstallPlanModel } from '../../models';
import { createDisableApplicationModal } from '../modals/disable-application-modal';
import { createSubscriptionChannelModal } from '../modals/subscription-channel-modal';
import { createInstallPlanApprovalModal } from '../modals/installplan-approval-modal';

export const SubscriptionHeader: React.SFC<SubscriptionHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-md-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-2" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-2">Status</ColHead>
  <ColHead {...props} className="col-md-2">Channel</ColHead>
  <ColHead {...props} className="col-md-2">Approval Strategy</ColHead>
</ListHeader>;

const subscriptionState = (state: SubscriptionState) => {
  switch (state) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable: return <span><i className="fa fa-exclamation-triangle text-warning" /> Upgrade available</span>;
    case SubscriptionState.SubscriptionStateUpgradePending: return <span><i className="fa fa-spin fa-circle-o-notch co-catalog-spinner--downloading" /> Upgrading</span>;
    case SubscriptionState.SubscriptionStateAtLatest: return <span><i className="fa fa-check-circle" style={{color: '#2ec98e'}} /> Up to date</span>;
    default: return <span className={_.isEmpty(state) && 'text-muted'}>{state || 'Unknown'}</span>;
  }
};

export const SubscriptionRow: React.SFC<SubscriptionRowProps> = (props) => {
  const disableAction = () => ({
    label: 'Remove Subscription...',
    callback: () => createDisableApplicationModal({k8sKill, subscription: props.obj}),
  });
  const viewCSVAction = () => ({
    label: `View ${ClusterServiceVersionModel.kind}...`,
    href: `/k8s/ns/${props.obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${props.csv.metadata.name}`,
  });
  const actions = [disableAction, ...(props.csv ? [viewCSVAction] : [])];

  return <div className="row co-resource-list__item">
    <div className="col-md-3">
      <ResourceCog actions={actions} kind={referenceForModel(SubscriptionModel)} resource={props.obj} />
      <ResourceLink kind={referenceForModel(SubscriptionModel)} name={props.obj.metadata.name} namespace={props.obj.metadata.namespace} title={props.obj.metadata.name} />
    </div>
    <div className="col-md-2">
      <ResourceLink kind="Namespace" name={props.obj.metadata.namespace} title={props.obj.metadata.namespace} displayName={props.obj.metadata.namespace} />
    </div>
    <div className="col-md-2">
      {subscriptionState(_.get(props.obj.status, 'state'))}
    </div>
    <div className="col-md-2">
      {props.obj.spec.channel || 'default'}
    </div>
    <div className="col-md-2">
      {props.obj.spec.installPlanApproval || 'Automatic'}
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
  title="Subscriptions"
  showTitle={true}
  canCreate={true}
  createProps={{to: props.namespace ? `/k8s/ns/${props.namespace}/${CatalogSourceModel.plural}` : `/k8s/all-namespaces/${CatalogSourceModel.plural}`}}
  createButtonText="New Subscription"
  ListComponent={SubscriptionsList}
  filterLabel="Subscriptions by package"
  flatten={resources => _.flatMap(_.filter(resources, (v, k: string) => k === referenceForModel(SubscriptionModel)), (resource: any) => resource.data)}
  resources={[
    {kind: referenceForModel(SubscriptionModel), isList: true, namespaced: true},
    {kind: referenceForModel(ClusterServiceVersionModel), isList: true, namespaced: true},
  ]} />;

export class SubscriptionDetails extends React.Component<SubscriptionDetailsProps, SubscriptionDetailsState> {
  constructor(props) {
    super(props);
    this.state = {waitingForUpdate: false};
  }

  render() {
    const {obj, pkg, installedCSV} = this.props;
    const modal = (e: React.MouseEvent<HTMLAnchorElement>, field: 'channel' | 'approval') => {
      e.preventDefault();

      return (
        field === 'channel' && createSubscriptionChannelModal({subscription: obj, pkg, k8sUpdate}) ||
        field === 'approval' && createInstallPlanApprovalModal({obj, k8sUpdate})
      ).result.then(() => this.setState({waitingForUpdate: true}));
    };

    return <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        <div className="co-detail-table">
          <div className="co-detail-table__row row">
            <div className="co-detail-table__section col-sm-3">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Channel</dt>
                <dd>{ this.state.waitingForUpdate
                  // FIXME(alecmerdler): Spinner stays forever because new `props.obj` not received after modal calls `k8sUpdated`
                  ? <LoadingInline />
                  : <a className="co-m-modal-link" href="#" onClick={(e) => modal(e, 'channel')}>{obj.spec.channel || 'default'}</a>
                }</dd>
              </dl>
            </div>
            <div className="co-detail-table__section col-sm-3">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Approval</dt>
                <dd>{ this.state.waitingForUpdate
                  // FIXME(alecmerdler): Spinner stays forever because new `props.obj` not received after modal calls `k8sUpdated`
                  ? <LoadingInline />
                  : <a className="co-m-modal-link" href="#" onClick={(e) => modal(e, 'approval')}>{obj.spec.installPlanApproval || 'Automatic'}</a>
                }</dd>
              </dl>
            </div>
            <div className="co-detail-table__section co-detail-table__section--last col-sm-6">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Upgrade Status</dt>
                <dd>{subscriptionState(_.get(obj.status, 'state'))}</dd>
              </dl>
              <div className="co-detail-table__bracket"></div>
              <div className="co-detail-table__breakdown">
                { _.get(obj.status, 'installedCSV') && !_.isEmpty(installedCSV)
                  ? <Link to={`/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${_.get(obj.status, 'installedCSV')}`}>1 installed</Link>
                  : <span>0 installed</span> }
                { _.get(obj.status, 'state') === SubscriptionState.SubscriptionStateUpgradePending && _.get(obj.status, 'installplan')
                  ? <Link to={`/k8s/ns/${obj.metadata.namespace}/${InstallPlanModel.plural}/${_.get(obj.status, 'installplan.name')}`}>1 installing</Link>
                  : <span>0 installing</span> }
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} showAnnotations={false} />
          </div>
          <div className="col-sm-6">
            {/* TODO(alecmerdler): Show if InstallPlan needs approval */}
            <dl className="co-m-pane__details">
              <dt>Installed Version</dt>
              <dd>
                { _.get(obj.status, 'installedCSV') && !_.isEmpty(installedCSV)
                  ? <ResourceLink kind={referenceForModel(ClusterServiceVersionModel)} name={_.get(obj.status, 'installedCSV')} namespace={obj.metadata.namespace} title={_.get(obj.status, 'installedCSV')} />
                  : 'None' }
              </dd>
              <dt>Starting Version</dt>
              <dd>{obj.spec.startingCSV || 'None'}</dd>
              <dt>Catalog</dt>
              <dd>
                <ResourceLink kind={referenceForModel(CatalogSourceModel)} name={obj.spec.source} namespace={obj.metadata.namespace} title={obj.spec.source} />
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>;
  }
}

export const SubscriptionDetailsWrapper: React.SFC<SubscriptionDetailsWrapperProps> = ({obj}) => {
  const resources = [
    {kind: ConfigMapModel.kind, name: obj.spec.source, namespace: 'tectonic-system', isList: false, prop: 'configMap'},
    {kind: referenceForModel(ClusterServiceVersionModel), name: obj.status.installedCSV, namespace: obj.metadata.namespace, isList: false, prop: 'installedCSV'},
    ...(_.get(obj, 'status.installplan.name') ? [{kind: referenceForModel(InstallPlanModel), name: obj.status.installplan.name, namespace: obj.metadata.namespace, isList: false, prop: 'installPlan'}] : [])
  ];

  const pkgFor = (configMap: {loaded: boolean, data: K8sResourceKind}) => (_.get(configMap, 'data.data.packages') ? safeLoad(_.get(configMap, 'data.data.packages')) : [])
    .find(pkg => pkg.packageName === obj.spec.name);

  type InnerProps = {
    configMap: {loaded: boolean, data: K8sResourceKind},
    installPlan: {loaded: boolean, data: InstallPlanKind},
    installedCSV: {loaded: boolean, data: ClusterServiceVersionKind},
  };
  const Inner = (props: InnerProps) => <SubscriptionDetails obj={obj} pkg={pkgFor(props.configMap)} installPlan={props.installPlan.data} installedCSV={props.installedCSV.data} />;

  return <Firehose resources={resources}>
    <Inner {...{} as any} />
  </Firehose>;
};

export const SubscriptionDetailsPage: React.SFC<SubscriptionDetailsPageProps> = (props) => <DetailsPage
  {...props}
  namespace={props.match.params.ns}
  kind={referenceForModel(SubscriptionModel)}
  name={props.match.params.name}
  pages={[
    navFactory.details(SubscriptionDetailsWrapper),
    navFactory.editYaml(),
    // TODO(alecmerdler): List of InstallPlan-v1s with `ownerReferences` to Subscription-v1
  ]}
  menuActions={Cog.factory.common} />;

export type SubscriptionsPageProps = {
  namespace?: string;
  match?: match<{ns?: string}>;
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

export type SubscriptionDetailsWrapperProps = {
  obj: SubscriptionKind;
};

export type SubscriptionDetailsProps = {
  obj: SubscriptionKind;
  pkg: Package;
  installPlan?: InstallPlanKind;
  installedCSV?: ClusterServiceVersionKind;
};

export type SubscriptionDetailsState = {
  waitingForUpdate: boolean;
};

export type SubscriptionDetailsPageProps = {
  match: match<{ns: string, name: string}>;
};

SubscriptionHeader.displayName = 'SubscriptionHeader';
SubscriptionRow.displayName = 'SubscriptionRow';
SubscriptionsList.displayName = 'SubscriptionsList';
SubscriptionsPage.displayName = 'SubscriptionsPage';
SubscriptionDetailsPage.displayName = 'SubscriptionDetailsPage';
SubscriptionDetailsWrapper.displayName = 'SubscriptionDetailsWrapper';
