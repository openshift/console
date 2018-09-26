import * as React from 'react';
import * as _ from 'lodash-es';

import { DeploymentModel } from '../models';
import { configureUpdateStrategyModal } from './modals';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { formatDuration } from './utils/datetime';
import { connectToModel } from '../kinds';
import { ResourceOverviewHeading } from './overview';
import {
  DetailsPage,
  List,
  ListPage,
  WorkloadListHeader,
  WorkloadListRow
} from './factory';
import {
  AsyncComponent,
  Cog,
  ContainerTable,
  DeploymentPodCounts,
  LoadingInline,
  navFactory,
  pluralize,
  ResourceSummary,
  SectionHeading
} from './utils';

const {ModifyCount, EditEnvironment, common} = Cog.factory;

const UpdateStrategy = (kind, deployment) => ({
  label: 'Edit Update Strategy',
  callback: () => configureUpdateStrategyModal({deployment}),
});

const menuActions = [
  ModifyCount,
  UpdateStrategy,
  EditEnvironment,
  ...common,
];

const DeploymentDetailsList = ({deployment}) => {
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

export const DeploymentOverview = connectToModel(({kindObj, resource: deployment}) =>
  <div className="co-m-pane resource-overview">
    <ResourceOverviewHeading
      actions={menuActions}
      kindObj={kindObj}
      resource={deployment}
    />
    <div className="co-m-pane__body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <DeploymentPodCounts resource={deployment} resourceKind={DeploymentModel} sidebar={true} />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={deployment}>
          <dt>Status</dt>
          <dd>{deployment.status.availableReplicas === deployment.status.updatedReplicas ? <span>Active</span> : <div><span className="co-icon-space-r"><LoadingInline /></span> Updating</div>}</dd>
        </ResourceSummary>
      </div>
      <div className="resource-overview__details">
        <DeploymentDetailsList deployment={deployment} />
      </div>
    </div>
  </div>);

const DeploymentDetails = ({obj: deployment}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Deployment Overview" />
      <DeploymentPodCounts resource={deployment} resourceKind={DeploymentModel} />
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={deployment}>
              <dt>Status</dt>
              <dd>{deployment.status.availableReplicas === deployment.status.updatedReplicas ? <span>Active</span> : <div><span className="co-icon-space-r"><LoadingInline /></span> Updating</div>}</dd>
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
  rawEnvData={props.obj.spec.template.spec.containers}
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
