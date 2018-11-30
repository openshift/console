/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';

import { Firehose, HorizontalNav } from '../utils';
import { K8sResourceKind, referenceForModel } from '../../module/k8s';
import { ClusterVersionModel } from '../../models';
import { ClusterOperatorPage } from './cluster-operator';

enum ClusterUpdateStatus {
  UpToDate = 'Up to Date',
  UpdatesAvailable = 'Updates Available',
  Updating = 'Updating',
  Failing = 'Failing',
  ErrorRetrieving = 'Error Retrieving',
}

const clusterVersionReference = referenceForModel(ClusterVersionModel);

const FailedConditionAlert = ({message, condition}) => <div className="alert alert-danger">
  <i className="pficon pficon-error-circle-o" aria-hidden="true" /> <strong>{message}</strong> {condition.message}
</div>;

const getClusterUpdateStatus = (cv: K8sResourceKind): ClusterUpdateStatus => {
  const conditions = _.get(cv, 'status.conditions', []);
  const isFailingCondition = _.find(conditions, { type: 'Failing', status: 'True' });
  if (isFailingCondition) {
    return ClusterUpdateStatus.Failing;
  }

  const retrievedUpdatesFailedCondition = _.find(conditions, { type: 'RetrievedUpdates', status: 'False' });
  if (retrievedUpdatesFailedCondition) {
    return ClusterUpdateStatus.ErrorRetrieving;
  }

  const isProgressingCondition = _.find(conditions, { type: 'Progressing', status: 'True' });
  if (isProgressingCondition) {
    return ClusterUpdateStatus.Updating;
  }

  const updates = _.get(cv, 'status.availableUpdates');
  return _.isEmpty(updates) ? ClusterUpdateStatus.UpToDate : ClusterUpdateStatus.UpdatesAvailable;
};

const getIconClass = (status: ClusterUpdateStatus) => {
  return {
    [ClusterUpdateStatus.UpToDate]: 'pficon pficon-ok text-success',
    [ClusterUpdateStatus.UpdatesAvailable]: 'fa fa-arrow-circle-up text-success',
    [ClusterUpdateStatus.Updating]: 'pficon pficon-in-progress',
    [ClusterUpdateStatus.Failing]: 'pficon pficon-error-circle-o text-danger',
    [ClusterUpdateStatus.ErrorRetrieving]: 'pficon pficon-error-circle-o text-danger',
  }[status];
};

const UpdateStatus: React.SFC<UpdateStatusProps> = ({cv}) => {
  const status = getClusterUpdateStatus(cv);
  const iconClass = getIconClass(status);
  return <React.Fragment>
    <i className={iconClass} aria-hidden="true" />&nbsp;{status}
  </React.Fragment>;
};

const CurrentVersion: React.SFC<CurrentVersionProps> = ({cv}) => {
  const currentVersion = _.get(cv, 'status.current.version');
  return currentVersion || <React.Fragment><i className="pficon pficon-warning-triangle-o" aria-hidden="true" />&nbsp;Unknown</React.Fragment>;
};

const ClusterVersionDetailsTable: React.SFC<ClusterVersionDetailsTableProps> = ({obj: cv}) => {
  const conditions = _.get(cv, 'status.conditions', []);
  const retrievedUpdatesFailedCondition = _.find(conditions, { type: 'RetrievedUpdates', status: 'False' });
  const isFailingCondition = _.find(conditions, { type: 'Failing', status: 'True' });
  const payload = _.get(cv, 'status.current.payload');
  return <div className="co-m-pane__body">
    <div className="co-m-pane__body-group">
      {isFailingCondition && <FailedConditionAlert message="Upgrade is failing." condition={isFailingCondition} />}
      {retrievedUpdatesFailedCondition && <FailedConditionAlert message="Could not retrieve updates." condition={retrievedUpdatesFailedCondition} />}
      <div className="co-detail-table">
        <div className="co-detail-table__row row">
          <div className="co-detail-table__section">
            <dl className="co-m-pane__details">
              <dt className="co-detail-table__section-header">Channel</dt>
              <dd>{cv.spec.channel}</dd>
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
              <dt className="co-detail-table__section-header">Current Version</dt>
              <dd><CurrentVersion cv={cv} /></dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body-group">
      <dl className="co-m-pane__details">
        <dt>Cluster ID</dt>
        <dd>{cv.spec.clusterID}</dd>
        <dt>Current Payload</dt>
        <dd>{payload}</dd>
      </dl>
    </div>
  </div>;
};

const ClusterOperatorTabPage: React.SFC = () => <ClusterOperatorPage autoFocus={false} showTitle={false} />;

const pages = [{
  href: '',
  name: 'Overview',
  component: ClusterVersionDetailsTable,
}, {
  href: 'clusteroperators',
  name: 'Cluster Operators',
  component: ClusterOperatorTabPage,
}];

export const ClusterSettingsPage: React.SFC<ClusterSettingsPageProps> = ({match}) => {
  const title = 'Cluster Settings';
  const resources = [
    {kind: clusterVersionReference, name: 'version', isList: false, prop: 'obj'},
  ];
  return <React.Fragment>
    <Helmet>
      <title>{title}</title>
    </Helmet>
    <div className="co-m-nav-title">
      <h1 className="co-m-pane__heading">{title}</h1>
    </div>
    <Firehose resources={resources}>
      <HorizontalNav pages={pages} match={match} hideDivider />;
    </Firehose>
  </React.Fragment>;
};

type UpdateStatusProps = {
  cv: K8sResourceKind;
};

type CurrentVersionProps = {
  cv: K8sResourceKind;
};

type ClusterVersionDetailsTableProps = {
  obj: K8sResourceKind;
};

type ClusterSettingsPageProps = {
  match: any;
};
