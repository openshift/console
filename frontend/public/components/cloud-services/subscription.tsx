/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match, Link } from 'react-router-dom';
import { safeLoad } from 'js-yaml';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';

import { List, ListHeader, ColHead, DetailsPage, ListPage } from '../factory';
import { MsgBox, ResourceLink, ResourceCog, navFactory, Cog, ResourceSummary, LoadingInline, makeQuery, makeReduxID } from '../utils';
import { SubscriptionKind, SubscriptionState, Package, InstallPlanApproval, ClusterServiceVersionKind } from './index';
import { referenceForModel, k8sKill, k8sUpdate } from '../../module/k8s';
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
    href: `/k8s/ns/${props.obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${_.get(props.obj.status, 'installedCSV')}`,
  });
  const actions = [disableAction, ...(_.get(props.obj.status, 'installedCSV') ? [viewCSVAction] : [])];

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

export const SubscriptionsList: React.SFC<SubscriptionsListProps> = (props) => <List
  {...props}
  Row={SubscriptionRow}
  Header={SubscriptionHeader}
  EmptyMsg={() => <MsgBox title="No Subscriptions Found" detail="Each namespace can subscribe to a single channel of a package for automatic updates." />} />;

export const SubscriptionsPage: React.SFC<SubscriptionsPageProps> = (props) => <ListPage
  {...props}
  kind={referenceForModel(SubscriptionModel)}
  title="Subscriptions"
  showTitle={true}
  canCreate={true}
  createProps={{to: props.namespace ? `/k8s/ns/${props.namespace}/${CatalogSourceModel.plural}` : `/k8s/all-namespaces/${CatalogSourceModel.plural}`}}
  createButtonText="New Subscription"
  ListComponent={SubscriptionsList}
  filterLabel="Subscriptions by package" />;

const stateToProps = ({k8s}, {obj}) => ({
  installedCSV: k8s.getIn([makeReduxID(ClusterServiceVersionModel, makeQuery(obj.metadata.namespace)), 'data'], ImmutableMap())
    .find((csv, key) => csv.getIn(['metadata', 'name']) === _.get(obj, 'status.installedCSV')),
  pkg: (safeLoad(k8s.getIn([makeReduxID(ConfigMapModel, makeQuery('tectonic-system', null, null, obj.spec.source)), 'data', 'data', 'packages'], null)) || [])
    .find((pkg: Package) => pkg.packageName === obj.spec.name),
});

export const SubscriptionDetails = connect(stateToProps, null)((props: SubscriptionDetailsProps) => {
  const {obj, pkg, installedCSV} = props;

  return <div className="co-m-pane__body">
    <div className="co-m-pane__body-group">
      <SubscriptionUpdates pkg={pkg} obj={obj} installedCSV={installedCSV} />
    </div>
    <div className="co-m-pane__body-group">
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={obj} showNodeSelector={false} showPodSelector={false} showAnnotations={false} />
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>Installed Version</dt>
            <dd>
              { _.get(obj.status, 'installedCSV') && installedCSV
                ? <ResourceLink kind={referenceForModel(ClusterServiceVersionModel)} name={obj.status.installedCSV} namespace={obj.metadata.namespace} title={obj.status.installedCSV} />
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
});

export class SubscriptionUpdates extends React.Component<SubscriptionUpdatesProps, SubscriptionUpdatesState> {
  constructor(props) {
    super(props);
    this.state = {
      waitingForUpdate: false,
      installPlanApproval: _.get(props.obj, 'spec.installPlanApproval'),
      channel: _.get(props.obj, 'spec.channel'),
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const stillWaiting = prevState.waitingForUpdate
      && (_.get(nextProps, 'obj.spec.channel') === prevState.channel && _.get(nextProps, 'obj.spec.installPlanApproval') === prevState.installPlanApproval);

    return stillWaiting
      ? null
      : {waitingForUpdate: false, channel: _.get(nextProps, 'obj.spec.channel'), installPlanApproval: _.get(nextProps, 'obj.spec.installPlanApproval')};
  }

  render() {
    const {obj, pkg, installedCSV} = this.props;

    const k8sUpdateAndWait = (...args) => k8sUpdate(...args).then(() => this.setState({waitingForUpdate: true}));
    const channelModal = () => createSubscriptionChannelModal({subscription: obj, pkg, k8sUpdate: k8sUpdateAndWait});
    const approvalModal = () => createInstallPlanApprovalModal({obj, k8sUpdate: k8sUpdateAndWait});

    return <div className="co-detail-table">
      <div className="co-detail-table__row row">
        <div className="co-detail-table__section col-sm-3">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Channel</dt>
            <dd>{ this.state.waitingForUpdate
              ? <LoadingInline />
              : <a className="co-m-modal-link" onClick={() => channelModal()}>{obj.spec.channel || 'default'}</a>
            }</dd>
          </dl>
        </div>
        <div className="co-detail-table__section col-sm-3">
          <dl className="co-m-pane__details">
            <dt className="co-detail-table__section-header">Approval</dt>
            <dd>{ this.state.waitingForUpdate
              ? <LoadingInline />
              : <a className="co-m-modal-link" onClick={() => approvalModal()}>{obj.spec.installPlanApproval || 'Automatic'}</a>
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
            { _.get(obj.status, 'installedCSV') && installedCSV
              ? <Link to={`/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${_.get(obj.status, 'installedCSV')}`}>1 installed</Link>
              : <span>0 installed</span> }
            { _.get(obj.status, 'state') === SubscriptionState.SubscriptionStateUpgradePending && _.get(obj.status, 'installplan')
              ? <Link to={`/k8s/ns/${obj.metadata.namespace}/${InstallPlanModel.plural}/${_.get(obj.status, 'installplan.name')}`}>1 installing</Link>
              : <span>0 installing</span> }
          </div>
        </div>
      </div>
    </div>;
  }
}

export const SubscriptionDetailsPage: React.SFC<SubscriptionDetailsPageProps> = (props) => <DetailsPage
  {...props}
  namespace={props.match.params.ns}
  kind={referenceForModel(SubscriptionModel)}
  name={props.match.params.name}
  pages={[
    navFactory.details(SubscriptionDetails),
    navFactory.editYaml(),
  ]}
  resources={[
    // FIXME: Only including `tectonic-ocs` catalog's configmap, need to revise when we support more catalog sources
    {kind: ConfigMapModel.kind, name: 'tectonic-ocs', namespace: 'tectonic-system', isList: false, prop: 'configMap'},
    {kind: referenceForModel(ClusterServiceVersionModel), namespace: props.namespace, isList: true, prop: 'clusterServiceVersion'},
  ]}
  menuActions={Cog.factory.common} />;

export type SubscriptionsPageProps = {
  namespace?: string;
  match?: match<{ns?: string}>;
};

export type SubscriptionsListProps = {
  loaded: boolean;
  loadError?: string;
  data: (SubscriptionKind)[];
};

export type SubscriptionHeaderProps = {

};

export type SubscriptionRowProps = {
  obj: SubscriptionKind;
};

export type SubscriptionUpdatesProps = {
  obj: SubscriptionKind;
  pkg: Package;
  installedCSV?: ClusterServiceVersionKind;
};

export type SubscriptionUpdatesState = {
  waitingForUpdate: boolean;
  channel: string;
  installPlanApproval: InstallPlanApproval;
};

export type SubscriptionDetailsProps = {
  obj: SubscriptionKind;
  pkg: Package;
  installedCSV?: ClusterServiceVersionKind;
};

export type SubscriptionDetailsPageProps = {
  match: match<{ns: string, name: string}>;
  namespace: string;
};

SubscriptionHeader.displayName = 'SubscriptionHeader';
SubscriptionRow.displayName = 'SubscriptionRow';
SubscriptionsList.displayName = 'SubscriptionsList';
SubscriptionsPage.displayName = 'SubscriptionsPage';
SubscriptionDetails.displayName = 'SubscriptionDetails';
SubscriptionDetailsPage.displayName = 'SubscriptionDetailsPage';
