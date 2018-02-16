import * as React from 'react';
import * as _ from 'lodash';
import { Map as ImmutableMap } from 'immutable';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';

import { MultiListPage, List, ListHeader, ColHead, ResourceRow } from '../factory';
import { NavTitle, MsgBox } from '../utils';
import { ClusterServiceVersionLogo, CatalogEntryKind, ClusterServiceVersionKind, ClusterServiceVersionPhase, isEnabled, CatalogEntryVisibility, catalogEntryVisibilityLabel, SubscriptionKind, InstallPlanKind } from './index';
import { createEnableApplicationModal } from '../modals/enable-application-modal';
import { createDisableApplicationModal } from '../modals/disable-application-modal';
import { k8sCreate, k8sKill, K8sResourceKind, referenceForModel } from '../../module/k8s';
import { ClusterServiceVersionModel, UICatalogEntryModel, SubscriptionModel, InstallPlanModel } from '../../models';
import { withFallback } from '../utils/error-boundary';

export const CatalogAppHeader: React.SFC<CatalogAppHeaderProps> = (props) => <ListHeader>
  <ColHead {...props} className="col-md-4 col-xs-8" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-5 hidden-sm">Status</ColHead>
  <ColHead {...props} className="col-md-3 col-xs-4" />
</ListHeader>;

export const Breakdown: React.SFC<BreakdownProps> = (props) => {
  const {failed, pending, succeeded, awaiting} = props.status;
  const pluralizeNS = (count: number) => count !== 1 ? 'namespaces' : 'namespace';

  if (props.clusterServiceVersions.length === 0) {
    return <span className="text-muted">Not enabled</span>;
  }
  if (failed.length > 0) {
    return <div>
      <span style={{marginRight: '5px'}}>
        <i className="fa fa-ban co-error" />
      </span>
      <span>Error </span>
      <span className="text-muted">
        ({`${failed.length} ${pluralizeNS(failed.length)} failed`}{awaiting.length > 0 && `, ${awaiting.length} ${pluralizeNS(awaiting.length)} not supported`}{pending.length > 0 && `, ${pending.length} ${pluralizeNS(pending.length)} pending`}{succeeded.length > 0 && `, ${succeeded.length} ${pluralizeNS(succeeded.length)} enabled`})
      </span>
    </div>;
  }
  if (pending.length > 0 || awaiting.length > 0) {
    return <div>
      <span style={{marginRight: '5px'}}>
        <i className="fa fa-spin fa-circle-o-notch co-catalog-spinner--downloading" />
      </span>
      <span>Enabling... </span>
      <span className="text-muted">({succeeded.length} of {props.clusterServiceVersions.length} {pluralizeNS(props.clusterServiceVersions.length)})</span>
    </div>;
  }
  if (succeeded.length > 0) {
    return <div>
      <span>Enabled </span>
      <span className="text-muted">({succeeded.length} {pluralizeNS(succeeded.length)})</span>
      { props.warnSubscribe && <span style={{color: '#fca657'}}> <i className="fa fa-exclamation-triangle" /> Not subscribed to updates</span> }
    </div>;
  }
  return <span />;
};

export const BreakdownDetail: React.SFC<BreakdownDetailProps> = (props) => {
  const {subscriptions = [], soloInstallPlans = []} = props;
  const {pending, succeeded, failed, awaiting, deleting} = props.status;
  const percent = (succeeded.length / [...pending, ...succeeded, ...failed, ...awaiting].length) * 100;

  return <div>
    <div style={{margin: '15px 0'}}>
      { percent < 100 && pending.length > 0 && <div className="co-catalog-install-progress">
        <div style={{width: `${percent}%`}} className="co-catalog-install-progress-bar co-catalog-install-progress-bar--active" />
      </div> }
    </div>
    <ul className="co-catalog-breakdown__ns-list">{ [...pending, ...succeeded, ...failed, ...awaiting].map((csv, i) => {
      switch (csv.status.phase) {
        case ClusterServiceVersionPhase.CSVPhaseSucceeded:
          return <li className="co-catalog-breakdown__ns-list__item" key={i}>
            <Link to={`/applications/ns/${csv.metadata.namespace}/${csv.metadata.name}`} tabIndex={-1}>{csv.metadata.namespace}</Link>
            { soloInstallPlans.some(({metadata}) => metadata.namespace === csv.metadata.namespace) && !subscriptions.some(({metadata}) => metadata.namespace === csv.metadata.namespace) && <span style={{marginLeft: '10px', display: 'inline-flex'}}>
              <a className="co-m-modal-link" style={{color: '#fca657'}} tabIndex={-1} onClick={() => props.subscribe(csv.metadata.namespace)}>Subscribe to updates</a>
            </span> }
          </li>;
        case ClusterServiceVersionPhase.CSVPhaseFailed:
          return <li className="co-catalog-breakdown__ns-list__item co-error" key={i}>
            <strong>{csv.metadata.namespace}</strong>: {csv.status.reason}
          </li>;
        case ClusterServiceVersionPhase.CSVPhasePending:
        case ClusterServiceVersionPhase.CSVPhaseInstalling:
          return <li className="co-catalog-breakdown__ns-list__item text-muted" key={i}>
            {csv.metadata.namespace}
          </li>;
        default:
          return <li className="co-catalog-breakdown__ns-list__item text-muted" key={i}>
            <strong>{csv.metadata.namespace}</strong>: Namespace not supported
          </li>;
      }
    }) }
    { deleting.map((csv, i) => <li key={i} className="co-catalog-breakdown__ns-list__item text-muted">
      <strong>{csv.metadata.namespace}</strong>: Disabling...
    </li>) }</ul>
  </div>;
};

const stateToProps = ({k8s}, {obj}) => ({
  namespaces: k8s.get('namespaces').toJS(),
  soloInstallPlans: _.values<InstallPlanKind>(k8s.getIn(['installplan-v1s', 'data'], ImmutableMap()).toJS())
    .filter((installPlan) => _.isEmpty(installPlan.metadata.ownerReferences))
    // FIXME(alecmerdler): This only checks 1 level of `replaces` for install plans created from old catalog entries
    .filter((installPlan) => (installPlan.spec.clusterServiceVersionNames || []).indexOf(_.get(obj.spec, 'spec.replaces')) > -1),
  clusterServiceVersions: _.values<ClusterServiceVersionKind>(k8s.getIn(['clusterserviceversion-v1s', 'data'], ImmutableMap()).toJS())
    .filter((csv) => csv.status !== undefined)
    // FIXME(alecmerdler): This only checks 1 level of `replaces` for CSVs created from old catalog entries
    .filter((csv) => csv.metadata.name === _.get(obj.spec, 'manifest.channels[0].currentCSV', '') || csv.metadata.name === _.get(obj.spec, 'spec.replaces', '')),
  subscriptions: _.values<SubscriptionKind>(k8s.getIn(['subscription-v1s', 'data'], ImmutableMap()).toJS())
    .filter((sub) => sub.spec.name === obj.spec.manifest.packageName),
});

export const CatalogAppRow = connect(stateToProps)(
  withFallback<CatalogAppRowProps>(
    class CatalogAppRow extends React.Component<CatalogAppRowProps, CatalogAppRowState> {
      constructor(props) {
        super(props);
        this.state = {...this.propsToState(props), expand: false};
      }

      componentWillReceiveProps(nextProps: CatalogAppRowProps) {
        this.setState(this.propsToState(nextProps));
      }

      render() {
        const {namespaces, obj, clusterServiceVersions = [], subscriptions = [], soloInstallPlans = []} = this.props;

        return <ResourceRow obj={obj}>
          <div className="co-catalog-app-row" style={{maxHeight: 60 + (this.state.expand ? clusterServiceVersions.length * 50 : 0)}}>
            <div className="col-md-4 col-xs-8">
              <ClusterServiceVersionLogo icon={_.get(obj.spec, 'spec.icon', [])[0]} version={_.get(obj.spec, 'spec.version', '')} displayName={_.get(obj.spec, 'spec.displayName', '')} provider={_.get(obj.spec, 'spec.provider', '')} />
            </div>
            <div className="col-md-5 hidden-sm">
              <div style={{marginTop: '10px'}}>
                <div style={{marginBottom: '15px'}}>
                  <Breakdown
                    clusterServiceVersions={clusterServiceVersions}
                    status={this.state}
                    warnSubscribe={clusterServiceVersions.some(csv => _.flatMap(soloInstallPlans, ({spec}) => spec.clusterServiceVersionNames).indexOf(csv.metadata.name) > -1)} />
                </div>
                { clusterServiceVersions.length === 1 && <a onClick={() => this.setState({expand: !this.state.expand})}>{`${this.state.expand ? 'Hide' : 'Show'} namespace`}</a> }
                { clusterServiceVersions.length > 1 && <a onClick={() => this.setState({expand: !this.state.expand})}>{`${this.state.expand ? 'Hide' : 'Show'} all ${clusterServiceVersions.length} namespaces`}</a> }
              </div>
              <div className={classNames('co-catalog-app-row__details', {'co-catalog-app-row__details--collapsed': !this.state.expand})}>
                <BreakdownDetail
                  clusterServiceVersions={clusterServiceVersions}
                  status={this.state}
                  soloInstallPlans={soloInstallPlans}
                  subscriptions={subscriptions}
                  subscribe={(ns: string) => createEnableApplicationModal({catalogEntry: obj, k8sCreate, namespaces, subscriptions, preSelected: [ns]})} />
              </div>
            </div>
            <div className="col-md-3 col-xs-4">
              <div className="co-catalog-app__row__actions">
                <button
                  className="btn btn-primary"
                  disabled={_.values(namespaces.data).filter((ns) => isEnabled(ns)).length <= clusterServiceVersions.length}
                  onClick={() => createEnableApplicationModal({catalogEntry: obj, k8sCreate, namespaces, subscriptions})}>
                  Enable
                </button>
                <button
                  className="btn btn-default co-catalog-disable-btn"
                  disabled={clusterServiceVersions.length === 0}
                  onClick={() => createDisableApplicationModal({catalogEntry: obj, k8sKill, namespaces, clusterServiceVersions, subscriptions})}>
                  Disable
                </button>
              </div>
            </div>
          </div>
        </ResourceRow>;
      }

      private propsToState(props: CatalogAppRowProps) {
        return {
          failed: props.clusterServiceVersions.filter(csv => _.get(csv, ['status', 'phase']) === ClusterServiceVersionPhase.CSVPhaseFailed),
          pending: props.clusterServiceVersions.filter(csv => [ClusterServiceVersionPhase.CSVPhasePending, ClusterServiceVersionPhase.CSVPhaseInstalling]
            .indexOf(_.get(csv, ['status', 'phase'])) !== -1)
            .filter(csv => !_.get(csv.metadata, 'deletionTimestamp')),
          succeeded: props.clusterServiceVersions.filter(csv => _.get(csv, ['status', 'phase']) === ClusterServiceVersionPhase.CSVPhaseSucceeded)
            .filter(csv => !_.get(csv.metadata, 'deletionTimestamp')),
          awaiting: props.clusterServiceVersions.filter(csv => !_.get(csv, ['status', 'phase']))
            .filter(csv => !_.get(csv.metadata, 'deletionTimestamp')),
          deleting: props.clusterServiceVersions.filter(csv => _.get(csv.metadata, 'deletionTimestamp')),
        };
      }
    }));

export const CatalogAppList: React.SFC<CatalogAppListProps> = (props) => {
  const EmptyMsg = () => <MsgBox title="No Applications Found" detail="Application entries are supplied by the Open Cloud Catalog." />;
  return <List {...props} Row={CatalogAppRow} Header={CatalogAppHeader} isList={true} label="Applications" EmptyMsg={EmptyMsg} />;
};

export const CatalogAppsPage: React.SFC = () => <MultiListPage
  ListComponent={CatalogAppList}
  filterLabel="Applications by name"
  title="Applications"
  showTitle={true}
  namespace="tectonic-system"
  flatten={resources => _.flatMap(_.filter(resources, (v, k: string) => k === referenceForModel(UICatalogEntryModel)), (resource: any) => resource.data)}
  resources={[
    {kind: referenceForModel(ClusterServiceVersionModel), isList: true, namespaced: false},
    {kind: referenceForModel(SubscriptionModel), isList: true, namespaced: false},
    {kind: referenceForModel(InstallPlanModel), isList: true, namespaced: false},
    {kind: 'Namespace', isList: true},
    {kind: referenceForModel(UICatalogEntryModel), isList: true, namespaced: true, selector: {matchLabels: {[catalogEntryVisibilityLabel]: CatalogEntryVisibility.catalogEntryVisibilityOCS}}}
  ]}
/>;

export const CatalogDetails: React.SFC = () => <div className="co-catalog-details co-m-pane">
  <div className="co-m-pane__body">
    <div className="col-xs-4">
      <dl>
        <dt>Name</dt>
        <dd>Open Cloud Services</dd>
      </dl>
    </div>
    <div className="col-xs-4">
      <dl>
        <dt>Provider</dt>
        <dd>CoreOS, Inc</dd>
      </dl>
    </div>
  </div>
  <div className="co-m-pane__body-section--bordered">
    <CatalogAppsPage />
  </div>
</div>;

export const CatalogsDetailsPage: React.SFC = () => <div>
  <Helmet>
    <title>Open Cloud Services</title>
  </Helmet>
  <NavTitle detail={true} title="Open Cloud Services" />
  <CatalogDetails />
</div>;

/* eslint-disable no-undef */
export type CatalogAppRowProps = {
  obj: CatalogEntryKind;
  namespaces: {data: {[name: string]: K8sResourceKind}, loaded: boolean, loadError: Object | string};
  clusterServiceVersions: ClusterServiceVersionKind[];
  subscriptions: SubscriptionKind[];
  soloInstallPlans: InstallPlanKind[];
};

export type CatalogAppRowState = {
  expand: boolean;
  failed: ClusterServiceVersionKind[];
  pending: ClusterServiceVersionKind[];
  succeeded: ClusterServiceVersionKind[];
  awaiting: ClusterServiceVersionKind[];
  deleting: ClusterServiceVersionKind[];
};

export type CatalogAppHeaderProps = {

};

export type CatalogAppListProps = {
  loaded: boolean;
  data: CatalogEntryKind[];
  filters: {[key: string]: any};
};

export type CatalogDetailsProps = {

};

export type BreakdownProps = {
  clusterServiceVersions: ClusterServiceVersionKind[];
  status: {failed: ClusterServiceVersionKind[], pending: ClusterServiceVersionKind[], succeeded: ClusterServiceVersionKind[], awaiting: ClusterServiceVersionKind[]};
  warnSubscribe: boolean;
};

export type BreakdownDetailProps = {
  clusterServiceVersions: ClusterServiceVersionKind[];
  status: {failed: ClusterServiceVersionKind[], pending: ClusterServiceVersionKind[], succeeded: ClusterServiceVersionKind[], awaiting: ClusterServiceVersionKind[], deleting: ClusterServiceVersionKind[]};
  soloInstallPlans: InstallPlanKind[];
  subscriptions: SubscriptionKind[];
  subscribe: (namespace: string) => void;
};
/* eslint-enable no-undef */

// TODO(alecmerdler): Find Webpack loader/plugin to add `displayName` to React components automagically
CatalogDetails.displayName = 'CatalogDetails';
CatalogsDetailsPage.displayName = 'CatalogDetailsPage';
CatalogAppHeader.displayName = 'CatalogAppHeader';
CatalogAppRow.displayName = 'CatalogAppRow';
CatalogAppList.displayName = 'CatalogAppList';
CatalogAppsPage.displayName = 'CatalogAppsPage';
Breakdown.displayName = 'Breakdown';
BreakdownDetail.displayName = 'BreakdownDetail';
