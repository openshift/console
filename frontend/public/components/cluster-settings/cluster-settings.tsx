// TODO (jon) - Remove mock code from this file once cluster update feature is complete

/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { Button } from 'patternfly-react';
import { Link } from 'react-router-dom';

import { Firehose, HorizontalNav, ResourceLink, resourcePathFromModel } from '../utils';
import { K8sResourceKind, referenceForModel } from '../../module/k8s';
import { ClusterAutoscalerModel, ClusterVersionModel } from '../../models';
import { ClusterOperatorPage } from './cluster-operator';
import { clusterUpdateModal } from '../modals';

enum ClusterUpdateStatus {
  UpToDate = 'Up to Date',
  UpdatesAvailable = 'Updates Available',
  Updating = 'Updating',
  Failing = 'Failing',
  ErrorRetrieving = 'Error Retrieving',
}

// TODO - REMOVE MOCK CODE
const MOCK_CLUSTER_UPDATE = localStorage.getItem('MOCK_CLUSTER_UPDATE');
// END MOCK CODE

const clusterAutoscalerReference = referenceForModel(ClusterAutoscalerModel);
const clusterVersionReference = referenceForModel(ClusterVersionModel);

export const getAvailableClusterUpdates = (cv) => {
  // TODO - REMOVE MOCK CODE
  if (MOCK_CLUSTER_UPDATE) {
    return [{ version: '4.0.0', payload: 'openshift/release:v4.0.0' }];
  }
  // END MOCK CODE

  return _.get(cv, 'status.availableUpdates');
};

export const getCurrentClusterVersion = (cv) => {
  return _.get(cv, 'status.current.version');
};


const launchUpdateModal = (cv) => {
  clusterUpdateModal({cv});
};

const getClusterUpdateStatus = (cv: K8sResourceKind): ClusterUpdateStatus => {
  // TODO - REMOVE MOCK CODE
  if (MOCK_CLUSTER_UPDATE) {
    return ClusterUpdateStatus.UpdatesAvailable;
  }
  // END MOCK CODE

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
    [ClusterUpdateStatus.UpToDate]: 'pficon pficon-ok',
    [ClusterUpdateStatus.UpdatesAvailable]: 'fa fa-arrow-circle-o-up',
    [ClusterUpdateStatus.Updating]: 'fa-spin pficon pficon-in-progress',
    [ClusterUpdateStatus.Failing]: 'pficon pficon-error-circle-o',
    [ClusterUpdateStatus.ErrorRetrieving]: 'pficon pficon-error-circle-o',
  }[status];
};

const FailedConditionAlert = ({message, condition}) => <div className="alert alert-danger">
  <i className="pficon pficon-error-circle-o" aria-hidden="true" /> <strong>{message}</strong> {condition.message}
</div>;

const UpdateInProgressAlert = () => <div className="alert alert-info">
  <i className="pficon pficon-info" aria-hidden={true} />
  Cluster update in progress.
  &nbsp;
  <Link to="/settings/cluster/clusteroperators">
    View detailed progress.
  </Link>
</div>;

const UpdatesAvailableAlert = ({cv}) => <div className="alert alert-info">
  <i className="pficon pficon-info" aria-hidden={true} />
  Cluster update is available.
  <Button bsStyle="link" onClick={()=> (launchUpdateModal(cv))}>
    Update Now
  </Button>
</div>;

const UpdateStatus: React.SFC<UpdateStatusProps> = ({cv}) => {
  const status = getClusterUpdateStatus(cv);
  const iconClass = getIconClass(status);
  return <React.Fragment>
    {
      status === ClusterUpdateStatus.UpdatesAvailable
        ? <Button bsStyle="link" onClick={() => (launchUpdateModal(cv))}>
          <i className={iconClass} aria-hidden={true}></i>
          &nbsp;
          {status}
        </Button>
        : <span>
          <i className={iconClass} aria-hidden={true}></i>
          &nbsp;
          {status}
        </span>
    }
  </React.Fragment>;
};

const CurrentVersion: React.SFC<CurrentVersionProps> = ({cv}) => {
  const currentVersion = getCurrentClusterVersion(cv);
  return currentVersion || <React.Fragment><i className="pficon pficon-warning-triangle-o" aria-hidden="true" />&nbsp;Unknown</React.Fragment>;
};



const ClusterVersionDetailsTable: React.SFC<ClusterVersionDetailsTableProps> = ({obj: cv, autoscalers}) => {
  const conditions = _.get(cv, 'status.conditions', []);

  // TODO - REMOVE MOCK CODE
  const retrievedUpdatesFailedCondition = !MOCK_CLUSTER_UPDATE && _.find(conditions, { type: 'RetrievedUpdates', status: 'False' });
  const isFailingCondition = !MOCK_CLUSTER_UPDATE && _.find(conditions, { type: 'Failing', status: 'True' });
  // END MOCK CODE

  const status = getClusterUpdateStatus(cv);
  return <div className="co-m-pane__body">
    <div className="co-m-pane__body-group">
      { status === ClusterUpdateStatus.Updating && <UpdateInProgressAlert /> }
      { status === ClusterUpdateStatus.UpdatesAvailable && <UpdatesAvailableAlert cv={cv} /> }
      { isFailingCondition && <FailedConditionAlert message="Upgrade is failing." condition={isFailingCondition} />}
      { retrievedUpdatesFailedCondition && <FailedConditionAlert message="Could not retrieve updates." condition={retrievedUpdatesFailedCondition} />}
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
        <dd>{_.get(cv, 'status.current.payload')}</dd>
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
  cv: K8sResourceKind;
};

type CurrentVersionProps = {
  cv: K8sResourceKind;
};

type ClusterVersionDetailsTableProps = {
  obj: K8sResourceKind;
  autoscalers: K8sResourceKind[];
};

type ClusterSettingsPageProps = {
  match: any;
};
