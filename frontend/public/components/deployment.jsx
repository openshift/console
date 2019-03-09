import * as React from 'react';
import * as _ from 'lodash-es';

import { DeploymentModel } from '../models';
import {configureUpdateStrategyModal, errorModal} from './modals';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { formatDuration } from './utils/datetime';
import {
  DetailsPage,
  List,
  ListPage,
  WorkloadListHeader,
  WorkloadListRow,
} from './factory';
import {
  AsyncComponent,
  Kebab,
  ContainerTable,
  DeploymentPodCounts,
  navFactory,
  pluralize,
  ResourceSummary,
  SectionHeading,
  StatusIcon,
  togglePaused,
  WorkloadPausedAlert,
} from './utils';

const {ModifyCount, AddStorage, EditEnvironment, common} = Kebab.factory;

const UpdateStrategy = (kind, deployment) => ({
  label: 'Edit Update Strategy',
  callback: () => configureUpdateStrategyModal({deployment}),
});

export const pauseAction = (kind, obj) => ({
  label: obj.spec.paused ? 'Resume Rollouts' : 'Pause Rollouts',
  callback: () => togglePaused(kind, obj).catch((err) => errorModal({error: err.message})),
});

export const menuActions = [
  ModifyCount,
  pauseAction,
  AddStorage,
  UpdateStrategy,
  EditEnvironment,
  ...common,
];

export const DeploymentDetailsList = ({deployment}) => {
  const isRecreate = (deployment.spec.strategy.type === 'Recreate');
  const progressDeadlineSeconds = _.get(deployment, 'spec.progressDeadlineSeconds');
  return <dl className="co-m-pane__details">
    <dt>Update Strategy</dt>
    <dd>{deployment.spec.strategy.type || 'RollingUpdate'}</dd>
    {isRecreate || <dt>Max Unavailable</dt>}
    {isRecreate || <dd>{deployment.spec.strategy.rollingUpdate.maxUnavailable || 1} of {pluralize(deployment.spec.replicas, 'pod')}</dd>}
    {isRecreate || <dt>Max Surge</dt>}
    {isRecreate || <dd>{deployment.spec.strategy.rollingUpdate.maxSurge || 1} greater than {pluralize(deployment.spec.replicas, 'pod')}</dd>}
    {progressDeadlineSeconds && <dt>Progress Deadline</dt>}
    {progressDeadlineSeconds && <dd>{/* Convert to ms for formatDuration */ formatDuration(progressDeadlineSeconds * 1000)}</dd>}
    <dt>Min Ready Seconds</dt>
    <dd>{deployment.spec.minReadySeconds ? pluralize(deployment.spec.minReadySeconds, 'second') : 'Not Configured'}</dd>
  </dl>;
};

const DeploymentDetails = ({obj: deployment}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Deployment Overview" />
      {deployment.spec.paused && <WorkloadPausedAlert obj={deployment} model={DeploymentModel} />}
      <DeploymentPodCounts resource={deployment} resourceKind={DeploymentModel} />
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={deployment} showPodSelector showNodeSelector>
              <dt>Status</dt>
              <dd>{deployment.status.availableReplicas === deployment.status.updatedReplicas ? <StatusIcon status="Active" /> : <StatusIcon status="Updating" />}</dd>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <DeploymentDetailsList deployment={deployment} />
          </div>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
      <ContainerTable containers={deployment.spec.template.spec.containers} />
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={deployment.status.conditions} />
    </div>
  </React.Fragment>;
};
const EnvironmentPage = (props) => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec}
  envPath={envPath}
  readOnly={false}
/>;

const {details, editYaml, pods, envEditor, events} = navFactory;
const DeploymentsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[details(DeploymentDetails), editYaml(), pods(), envEditor(environmentComponent), events(ResourceEventStream)]}
/>;

const Row = props => <WorkloadListRow {...props} kind="Deployment" actions={menuActions} />;
const DeploymentsList = props => <List {...props} Header={WorkloadListHeader} Row={Row} />;
const DeploymentsPage = props => <ListPage canCreate={true} ListComponent={DeploymentsList} {...props} />;

export {DeploymentsList, DeploymentsPage, DeploymentsDetailsPage};
