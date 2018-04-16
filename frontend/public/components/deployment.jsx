import * as React from 'react';

import { k8sKinds } from '../module/k8s';
import { SafetyFirst } from './safety-first';
import { configureReplicaCountModal, configureUpdateStrategyModal, configureRevisionHistoryLimitModal } from './modals';
import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { Cog, DeploymentPodCounts, navFactory, LoadingInline, pluralize, ResourceSummary } from './utils';
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
      <DeploymentPodCounts resource={deployment} resourceKind={k8sKinds.Deployment} openReplicaCountModal={this._openReplicaCountModal} desiredCountOutdated={this.state.desiredCountOutdated} />

      <div className="co-m-pane__body-group">
        <div className="row no-gutter">
          <div className="col-sm-6">
            <ResourceSummary resource={deployment}>
              <dt>Status</dt>
              <dd>{deployment.status.availableReplicas === deployment.status.updatedReplicas ? <span>Active</span> : <div><span className="co-icon-space-r"><LoadingInline /></span> Updating</div>}</dd>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
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

const {details, editYaml, pods, envEditor} = navFactory;
const DeploymentsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[details(Details), editYaml(), pods(), envEditor()]}
/>;

const Row = props => <WorkloadListRow {...props} kind="Deployment" actions={menuActions} />;
const DeploymentsList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
const DeploymentsPage = props => <ListPage canCreate={true} ListComponent={DeploymentsList} {...props} />;

export {DeploymentsList, DeploymentsPage, DeploymentsDetailsPage};
