/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { match, Link } from 'react-router-dom';

import { List, ListHeader, ColHead, DetailsPage, MultiListPage } from '../factory';
import { requireOperatorGroup } from './operator-group';
import { MsgBox, ResourceLink, ResourceKebab, navFactory, Kebab, ResourceSummary, LoadingInline, SectionHeading } from '../utils';
import { removeQueryArgument } from '../utils/router';
import { SubscriptionKind, SubscriptionState, PackageManifestKind, InstallPlanApproval, ClusterServiceVersionKind, olmNamespace, OperatorGroupKind, InstallPlanKind, InstallPlanPhase } from './index';
import { referenceForModel, k8sGet, k8sPatch, k8sKill, k8sUpdate } from '../../module/k8s';
import { SubscriptionModel, ClusterServiceVersionModel, CatalogSourceModel, InstallPlanModel, PackageManifestModel, OperatorGroupModel } from '../../models';
import { createDisableApplicationModal } from '../modals/disable-application-modal';
import { createSubscriptionChannelModal } from '../modals/subscription-channel-modal';
import { createInstallPlanApprovalModal } from '../modals/installplan-approval-modal';

export const SubscriptionHeader: React.SFC<SubscriptionHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-xs-6 col-sm-4 col-md-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-6 col-sm-4 col-md-3" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="hidden-xs col-sm-4 col-md-3 col-lg-2">Status</ColHead>
  <ColHead {...props} className="hidden-xs hidden-sm col-md-3 col-lg-2">Channel</ColHead>
  <ColHead {...props} className="hidden-xs hidden-sm hidden-md col-lg-2">Approval Strategy</ColHead>
</ListHeader>;

const subscriptionState = (state: SubscriptionState) => {
  switch (state) {
    case SubscriptionState.SubscriptionStateUpgradeAvailable: return <span><i className="pficon pficon-warning-triangle-o text-warning" /> Upgrade available</span>;
    case SubscriptionState.SubscriptionStateUpgradePending: return <span><i className="pficon pficon-in-progress text-primary" /> Upgrading</span>;
    case SubscriptionState.SubscriptionStateAtLatest: return <span><i className="pficon pficon-ok co-m-status--ok" /> Up to date</span>;
    default: return <span className={_.isEmpty(state) ? 'text-muted' : ''}>{state || 'Unknown'}</span>;
  }
};

const menuActions = [
  Kebab.factory.Edit,
  (kind, obj) => ({
    label: 'Remove Subscription...',
    callback: () => createDisableApplicationModal({k8sKill, k8sGet, k8sPatch, subscription: obj}),
  }),
  (kind, obj) => {
    const installedCSV = _.get(obj, 'status.installedCSV');
    return {
      label: `View ${ClusterServiceVersionModel.kind}...`,
      href: `/k8s/ns/${obj.metadata.namespace}/${ClusterServiceVersionModel.plural}/${installedCSV}`,
      hidden: !installedCSV,
    };
  },
];

export const SubscriptionRow: React.SFC<SubscriptionRowProps> = (props) => {
  return <div className="row co-resource-list__item">
    <div className="col-xs-6 col-sm-4 col-md-3">
      <ResourceLink kind={referenceForModel(SubscriptionModel)} name={props.obj.metadata.name} namespace={props.obj.metadata.namespace} title={props.obj.metadata.name} />
    </div>
    <div className="col-xs-6 col-sm-4 col-md-3">
      <ResourceLink kind="Namespace" name={props.obj.metadata.namespace} title={props.obj.metadata.namespace} displayName={props.obj.metadata.namespace} />
    </div>
    <div className="hidden-xs col-sm-4 col-md-3 col-lg-2">
      {subscriptionState(_.get(props.obj.status, 'state'))}
    </div>
    <div className="hidden-xs hidden-sm col-md-3 col-lg-2">
      {props.obj.spec.channel || 'default'}
    </div>
    <div className="hidden-xs hidden-sm hidden-md col-lg-2">
      {props.obj.spec.installPlanApproval || 'Automatic'}
    </div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions} kind={referenceForModel(SubscriptionModel)} resource={props.obj} />
    </div>
  </div>;
};

export const SubscriptionsList = requireOperatorGroup((props: SubscriptionsListProps) => <List
  {...props}
  Row={SubscriptionRow}
  Header={SubscriptionHeader}
  EmptyMsg={() => <MsgBox title="No Subscriptions Found" detail="Each namespace can subscribe to a single channel of a package for automatic updates." />} />);

export const SubscriptionsPage: React.SFC<SubscriptionsPageProps> = (props) => {
  const namespace = _.get(props.match, 'params.ns');
  return <MultiListPage
    {...props}
    namespace={namespace}
    resources={[
      {kind: referenceForModel(SubscriptionModel), namespace, namespaced: true, prop: 'subscription'},
      {kind: referenceForModel(OperatorGroupModel), namespace, namespaced: true, prop: 'operatorGroup'},
    ]}
    flatten={resources => _.get(resources.subscription, 'data', [])}
    title="Subscriptions"
    showTitle={false}
    canCreate={true}
    createProps={{to: namespace ? `/operatormanagement/ns/${namespace}` : '/operatormanagement/all-namespaces'}}
    createButtonText="Create Subscription"
    ListComponent={SubscriptionsList}
    filterLabel="Subscriptions by package" />;
};

export const SubscriptionDetails: React.SFC<SubscriptionDetailsProps> = (props) => {
  const {obj, installedCSV, pkg} = props;
  const catalogNS = obj.spec.sourceNamespace || olmNamespace;

  const Effect: React.SFC<{promise: () => Promise<any>}> = ({promise}) => {
    promise();
    return null;
  };

  return <div className="co-m-pane__body">
    <Effect promise={props.showDelete ? () => createDisableApplicationModal({k8sKill, k8sGet, k8sPatch, subscription: obj}).result.then(() => removeQueryArgument('showDelete')) : () => null} />

    <SectionHeading text="Subscription Overview" />
    <div className="co-m-pane__body-group">
      <SubscriptionUpdates pkg={pkg} obj={obj} installedCSV={installedCSV} installPlan={props.installPlan} />
    </div>
    <div className="co-m-pane__body-group">
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={obj} showAnnotations={false} />
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
            <dt>Catalog Source</dt>
            <dd>
              <ResourceLink kind={referenceForModel(CatalogSourceModel)} name={obj.spec.source} namespace={catalogNS} title={obj.spec.source} />
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>;
};

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
    const installPlanPhase = (installPlan: InstallPlanKind) => {
      switch (installPlan.status.phase) {
        case InstallPlanPhase.InstallPlanPhaseRequiresApproval: return '1 requires approval';
        case InstallPlanPhase.InstallPlanPhaseFailed: return '1 failed';
        default: return '1 installing';
      }
    };

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
            { _.get(obj.status, 'state') === SubscriptionState.SubscriptionStateUpgradePending && _.get(obj.status, 'installplan') && this.props.installPlan
              ? <Link to={`/k8s/ns/${obj.metadata.namespace}/${InstallPlanModel.plural}/${_.get(obj.status, 'installplan.name')}`}>
                <span>{installPlanPhase(this.props.installPlan)}</span>
              </Link>
              : <span>0 installing</span> }
          </div>
        </div>
      </div>
    </div>;
  }
}

export const SubscriptionDetailsPage: React.SFC<SubscriptionDetailsPageProps> = (props) => {
  type PkgFor = (pkgs: PackageManifestKind[]) => (obj: SubscriptionKind) => PackageManifestKind;
  const pkgFor: PkgFor = pkgs => obj => _.find(pkgs, (pkg => pkg.metadata.name === obj.spec.name && pkg.status.catalogSource === obj.spec.source));

  type InstalledCSV = (clusterServiceVersions?: ClusterServiceVersionKind[]) => (obj: SubscriptionKind) => ClusterServiceVersionKind;
  const installedCSV: InstalledCSV = clusterServiceVersions => obj => clusterServiceVersions.find(csv => csv.metadata.name === _.get(obj, 'status.installedCSV'));

  type DetailsProps = {
    clusterServiceVersions?: ClusterServiceVersionKind[];
    packageManifests?: PackageManifestKind[];
    installPlans?: InstallPlanKind[];
    obj: SubscriptionKind;
  };

  return <DetailsPage
    {...props}
    namespace={props.match.params.ns}
    kind={referenceForModel(SubscriptionModel)}
    name={props.match.params.name}
    pages={[
      navFactory.details((detailsProps: DetailsProps) => <SubscriptionDetails
        obj={detailsProps.obj}
        pkg={pkgFor(detailsProps.packageManifests)(detailsProps.obj)}
        installedCSV={installedCSV(detailsProps.clusterServiceVersions)(detailsProps.obj)}
        showDelete={new URLSearchParams(window.location.search).has('showDelete')}
        installPlan={(detailsProps.installPlans || []).find(ip => ip.metadata.name === _.get(detailsProps.obj.status, 'installplan.name'))}
      />),
      navFactory.editYaml(),
    ]}
    resources={[
      {kind: referenceForModel(PackageManifestModel), isList: true, namespace: props.namespace, prop: 'packageManifests'},
      {kind: referenceForModel(InstallPlanModel), isList: true, namespace: props.namespace, prop: 'installPlans'},
      {kind: referenceForModel(ClusterServiceVersionModel), namespace: props.namespace, isList: true, prop: 'clusterServiceVersions'},
    ]}
    menuActions={menuActions} />;
};

export type SubscriptionsPageProps = {
  namespace?: string;
  match?: match<{ns?: string}>;
};

export type SubscriptionsListProps = {
  loaded: boolean;
  loadError?: string;
  data: (SubscriptionKind)[];
  operatorGroup: {loaded: boolean, data?: OperatorGroupKind[]};
};

export type SubscriptionHeaderProps = {

};

export type SubscriptionRowProps = {
  obj: SubscriptionKind;
};

export type SubscriptionUpdatesProps = {
  obj: SubscriptionKind;
  pkg: PackageManifestKind;
  installedCSV?: ClusterServiceVersionKind;
  installPlan?: InstallPlanKind;
};

export type SubscriptionUpdatesState = {
  waitingForUpdate: boolean;
  channel: string;
  installPlanApproval: InstallPlanApproval;
};

export type SubscriptionDetailsProps = {
  obj: SubscriptionKind;
  pkg: PackageManifestKind;
  installedCSV?: ClusterServiceVersionKind;
  showDelete?: boolean;
  installPlan?: InstallPlanKind;
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
