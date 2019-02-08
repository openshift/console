/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Button } from 'patternfly-react';
import { Link } from 'react-router-dom';

import { ClusterOperatorPage } from './cluster-operator';
import { clusterChannelModal, clusterUpdateModal } from '../modals';
import { GlobalConfigPage } from './global-config';
import { ClusterAutoscalerModel } from '../../models';
import {
  ClusterUpdateStatus,
  ClusterVersionCondition,
  ClusterVersionConditionType,
  ClusterVersionKind,
  clusterVersionReference,
  getAvailableClusterUpdates,
  getClusterUpdateStatus,
  getClusterVersionCondition,
  getDesiredClusterVersion,
  isProgressing,
  K8sResourceConditionStatus,
  K8sResourceKind,
  referenceForModel,
  updateFailing,
} from '../../module/k8s';
import {
  EmptyBox,
  Firehose,
  HorizontalNav,
  ResourceLink,
  resourcePathFromModel,
  SectionHeading,
  Timestamp,
} from '../utils';

const clusterAutoscalerReference = referenceForModel(ClusterAutoscalerModel);

const CurrentChannel: React.SFC<CurrentChannelProps> = ({cv}) => <button className="btn btn-link co-m-modal-link" onClick={() => (clusterChannelModal({cv}))}>
  {cv.spec.channel || '-'}
</button>;

const getIconClass = (status: ClusterUpdateStatus) => {
  return {
    [ClusterUpdateStatus.UpToDate]: 'pficon pficon-ok',
    [ClusterUpdateStatus.UpdatesAvailable]: 'fa fa-arrow-circle-o-up',
    [ClusterUpdateStatus.Updating]: 'fa-spin fa fa-refresh',
    [ClusterUpdateStatus.Failing]: 'pficon pficon-error-circle-o',
    [ClusterUpdateStatus.ErrorRetrieving]: 'pficon pficon-error-circle-o',
  }[status];
};

const UpdateFailingAlert: React.SFC<UpdateFailingAlertProps> = ({condition, updatesAvailable=false}) => <div className="alert alert-danger">
  <i className="pficon pficon-error-circle-o" aria-hidden="true" />
  <strong>Update is failing.</strong>
  &nbsp;
  {condition.message && `${condition.message}. `}
  View <Link to="/settings/cluster/clusteroperators?orderBy=desc&sortBy=Status">Cluster Operators</Link> for more details
  {updatesAvailable && ' or check other available updates to try another version'}.
</div>;

const RetrieveUpdatesFailedAlert: React.SFC<RetrieveUpdatesFailedAlertProps> = ({condition}) => <div className="alert alert-danger">
  <i className="pficon pficon-error-circle-o" aria-hidden="true" />
  <strong>Could not retrieve updates.</strong>
  {condition.message && ` ${condition.message}.`}
</div>;

const UpdateInProgressAlert: React.SFC<UpdateInProgressAlertProps> = ({condition}) => <div className="alert alert-info">
  <i className="pficon pficon-info" aria-hidden={true} />
  <strong>Cluster update in progress.</strong>
  &nbsp;
  {condition.message && `${condition.message}. `}
  View <Link to="/settings/cluster/clusteroperators?orderBy=desc&sortBy=Status">Cluster Operators</Link> for more details.
</div>;

const UpdatesAvailableAlert: React.SFC<UpdatesAvailableAlertProps> = ({cv}) => {
  const currentlyUpdating = isProgressing(cv) || updateFailing(cv);
  const titleText = currentlyUpdating ? 'Other updates are available.' : 'Cluster update is available.';
  const buttonText = currentlyUpdating ? 'Update to a different version.' : 'Update now.';
  return <div className="alert alert-info">
    <i className="pficon pficon-info" aria-hidden={true} />
    <strong>
      {titleText}
    </strong>
    <Button bsStyle="link" className="co-m-modal-link" onClick={()=> (clusterUpdateModal({cv}))}>
      {buttonText}
    </Button>
  </div>;
};


const UpdateStatus: React.SFC<UpdateStatusProps> = ({cv}) => {
  const status = getClusterUpdateStatus(cv);
  const iconClass = getIconClass(status);
  return <React.Fragment>
    {
      status === ClusterUpdateStatus.UpdatesAvailable
        ? <Button bsStyle="link" className="co-m-modal-link" onClick={() => (clusterUpdateModal({cv}))}>
          <i className={iconClass} aria-hidden={true}></i>
          &nbsp;
          {status}
        </Button>
        : <span>
          {iconClass && <i className={iconClass} aria-hidden={true}></i>}
          &nbsp;
          {status}
        </span>
    }
  </React.Fragment>;
};

const DesiredVersion: React.SFC<DesiredVersionProps> = ({cv}) => {
  const version = getDesiredClusterVersion(cv);
  return version
    ? <React.Fragment>{version}</React.Fragment>
    : <React.Fragment><i className="pficon pficon-warning-triangle-o" aria-hidden="true" />&nbsp;Unknown</React.Fragment>;
};

const ClusterVersionDetailsTable: React.SFC<ClusterVersionDetailsTableProps> = ({obj: cv, autoscalers}) => {
  const { history = [] } = cv.status;
  const retrievedUpdatesFailedCondition = getClusterVersionCondition(cv, ClusterVersionConditionType.RetrievedUpdates, K8sResourceConditionStatus.False);
  const isFailingCondition = getClusterVersionCondition(cv, ClusterVersionConditionType.Failing, K8sResourceConditionStatus.True);
  const updatingCondition = getClusterVersionCondition(cv, ClusterVersionConditionType.Progressing, K8sResourceConditionStatus.True);
  const updatesAvailable = !_.isEmpty(getAvailableClusterUpdates(cv));

  return <React.Fragment>
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        { isFailingCondition && <UpdateFailingAlert condition={isFailingCondition} updatesAvailable={updatesAvailable} /> }
        { retrievedUpdatesFailedCondition && <RetrieveUpdatesFailedAlert condition={retrievedUpdatesFailedCondition} /> }
        { !isFailingCondition && updatingCondition && <UpdateInProgressAlert condition={updatingCondition} /> }
        { updatesAvailable && <UpdatesAvailableAlert cv={cv} /> }
        <div className="co-detail-table">
          <div className="co-detail-table__row row">
            <div className="co-detail-table__section">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Channel</dt>
                <dd><CurrentChannel cv={cv} /></dd>
              </dl>
            </div>
            <div className="co-detail-table__section">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Update Status</dt>
                <dd><UpdateStatus cv={cv} /></dd>
              </dl>
            </div>
            <div className="co-detail-table__section">
              <dl className="co-m-pane__details">
                <dt className="co-detail-table__section-header">Desired Version</dt>
                <dd><DesiredVersion cv={cv} /></dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body-group">
        <dl className="co-m-pane__details">
          <dt>Cluster ID</dt>
          <dd className="co-break-all">{cv.spec.clusterID}</dd>
          <dt>Desired Release Image</dt>
          <dd className="co-break-all">{_.get(cv, 'status.desired.image') || '-'}</dd>
          <dt>Cluster Autoscaler</dt>
          <dd>
            {_.isEmpty(autoscalers)
              ? <Link to={`${resourcePathFromModel(ClusterAutoscalerModel)}/new`}>
                <i className="pficon pficon-add-circle-o" aria-hidden="true" /> Create Autoscaler
              </Link>
              : autoscalers.map(autoscaler => <div key={autoscaler.metadata.uid}><ResourceLink kind={clusterAutoscalerReference} name={autoscaler.metadata.name} /></div>)}
          </dd>
        </dl>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Update History" />
      {_.isEmpty(history)
        ? <EmptyBox label="History" />
        : <div className="co-table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Version</th>
                <th>State</th>
                <th>Started</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {_.map(history, (update, i) => <tr key={i}>
                <td className="co-break-all">{update.version || '-'}</td>
                <td>{update.state || '-'}</td>
                <td><Timestamp timestamp={update.startedTime} /></td>
                <td>{update.completionTime ? <Timestamp timestamp={update.completionTime} /> : '-'}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      }
    </div>
  </React.Fragment>;
};

const ClusterOperatorTabPage: React.SFC = () => <ClusterOperatorPage autoFocus={false} showTitle={false} />;

const pages = [{
  href: '',
  name: 'Overview',
  component: ClusterVersionDetailsTable,
}, {
  href: 'globalconfig',
  name: 'Global Configuration',
  component: GlobalConfigPage,
}, {
  href: 'clusteroperators',
  name: 'Cluster Operators',
  component: ClusterOperatorTabPage,
}];

export const ClusterSettingsPage: React.SFC<ClusterSettingsPageProps> = ({match}) => {
  const title = 'Cluster Settings';
  const resources = [
    {kind: clusterVersionReference, name: 'version', isList: false, prop: 'obj'},
    {kind: clusterAutoscalerReference, isList: true, prop: 'autoscalers', optional: true},
  ];
  const resourceKeys = _.map(resources, 'prop');
  return <React.Fragment>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <div className="co-m-nav-title">
      <h1 className="co-m-pane__heading">{title}</h1>
    </div>
    <Firehose forceUpdate resources={resources}>
      <HorizontalNav pages={pages} match={match} resourceKeys={resourceKeys} hideDivider />
    </Firehose>
  </React.Fragment>;
};

type UpdateStatusProps = {
  cv: ClusterVersionKind;
};

type CurrentChannelProps = {
  cv: K8sResourceKind;
};

type DesiredVersionProps = {
  cv: ClusterVersionKind;
};

type ClusterVersionDetailsTableProps = {
  obj: ClusterVersionKind;
  autoscalers: K8sResourceKind[];
};

type ClusterSettingsPageProps = {
  match: any;
};

type UpdateFailingAlertProps = {
  condition: ClusterVersionCondition;
  updatesAvailable: boolean;
};

type RetrieveUpdatesFailedAlertProps = {
  condition: ClusterVersionCondition;
};

type UpdateInProgressAlertProps = {
  condition: ClusterVersionCondition;
};

type UpdatesAvailableAlertProps = {
  cv: ClusterVersionKind;
};
