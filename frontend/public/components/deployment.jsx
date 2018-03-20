import * as React from 'react';
import { Tooltip } from 'react-lightweight-tooltip';

import { k8sKinds } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { configureReplicaCountModal, configureUpdateStrategyModal, configureRevisionHistoryLimitModal } from './modals';
import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { Cog, navFactory, LoadingInline, pluralize, ResourceSummary } from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('apps/v1.Deployment', `apiVersion: apps/v1
kind: Deployment
metadata:
  name: example
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80`);

const {ModifyCount, ModifyNodeSelector, common} = Cog.factory;

const RevisionHistory = (kind, deployment) => ({
  label: 'Revision History...',
  callback: () => configureRevisionHistoryLimitModal({deployment}),
});

const UpdateStrategy = (kind, deployment) => ({
  label: 'Update Strategy...',
  callback: () => configureUpdateStrategyModal({deployment}),
});

const menuActions = [
  ModifyCount,
  RevisionHistory,
  UpdateStrategy,
  ModifyNodeSelector,
  ...common,
];

export class Details extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {
      desiredCountOutdated: false
    };
    this._openReplicaCountModal = this._openReplicaCountModal.bind(this);
  }

  componentWillReceiveProps() {
    this.setState({
      desiredCountOutdated: false
    });
  }

  _openReplicaCountModal(event) {
    event.preventDefault();
    event.target.blur();
    configureReplicaCountModal({
      resourceKind: k8sKinds.Deployment,
      resource: this.props.obj,
      invalidateState: (isInvalid) => {
        this.setState({
          desiredCountOutdated: isInvalid
        });
      }
    });
  }

  render() {
    const deployment = this.props.obj;
    const isRecreate = (deployment.spec.strategy.type === 'Recreate');

    return <div className="co-m-pane__body">
      <div className="co-m-pane__body-group">
        <div className="row no-gutter">
          <div className="co-detail-table">
            <div className="co-detail-table__row row">
              <div className="co-detail-table__section col-sm-3">
                <dl>
                  <dt className="co-detail-table__section-header">Desired Count</dt>
                  <dd>{this.state.desiredCountOutdated ? <LoadingInline /> : <a className="co-m-modal-link" href="#" onClick={this._openReplicaCountModal}>{pluralize(deployment.spec.replicas, 'pod')}</a>}</dd>
                </dl>
              </div>
              <div className="co-detail-table__section col-sm-3">
                <dl>
                  <dt className="co-detail-table__section-header">Up-to-date Count</dt>
                  <dd>
                    <Tooltip content="Total number of non-terminated pods targeted by this deployment that have the desired template spec.">
                      {pluralize(deployment.status.updatedReplicas, 'pod')}
                    </Tooltip>
                  </dd>
                </dl>
              </div>
              <div className="co-detail-table__section co-detail-table__section--last col-sm-6">
                <dl>
                  <dt className="co-detail-table__section-header">Matching Pods</dt>
                  <dd>
                    <Tooltip content="Total number of non-terminated pods targeted by this deployment (their labels match the selector)">
                      {pluralize(deployment.status.replicas, 'pod')}
                    </Tooltip>
                  </dd>
                </dl>
                <div className="co-detail-table__bracket"></div>
                <div className="co-detail-table__breakdown">
                  <Tooltip content="Total number of available pods (ready for at least minReadySeconds) targeted by this deployment">
                    {deployment.status.availableReplicas || 0} available
                  </Tooltip>
                  <Tooltip content="Total number of unavailable pods targeted by this deployment">{deployment.status.unavailableReplicas || 0} unavailable</Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="co-m-pane__body-group">
        <div className="row no-gutter">
          <div className="col-sm-6">
            <ResourceSummary resource={deployment}>
              <dt>Status</dt>
              <dd>{deployment.status.availableReplicas === deployment.status.updatedReplicas ? <span>Active</span> : <div><span className="co-icon-space-r"><LoadingInline /></span> Updating</div>}</dd>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <dl>
              <dt>Update Strategy</dt>
              <dd>{deployment.spec.strategy.type || 'RollingUpdate'}</dd>
              {isRecreate || <dt>Max Unavailable</dt>}
              {isRecreate || <dd>{deployment.spec.strategy.rollingUpdate.maxUnavailable || 1} of {pluralize(deployment.spec.replicas, 'pod')}</dd>}
              {isRecreate || <dt>Max Surge</dt>}
              {isRecreate || <dd>{deployment.spec.strategy.rollingUpdate.maxSurge || 1} greater than {pluralize(deployment.spec.replicas, 'pod')}</dd>}
              <dt>Min Ready Seconds</dt>
              <dd>{deployment.spec.minReadySeconds ? pluralize(deployment.spec.minReadySeconds, 'second') : 'Not Configured'}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>;
  }
}

const {details, editYaml, pods} = navFactory;
const DeploymentsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[details(Details), editYaml(), pods()]}
/>;

const Row = props => <WorkloadListRow {...props} kind="Deployment" actions={menuActions} />;
const DeploymentsList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
const DeploymentsPage = props => <ListPage canCreate={true} ListComponent={DeploymentsList} {...props} />;

export {DeploymentsList, DeploymentsPage, DeploymentsDetailsPage};
