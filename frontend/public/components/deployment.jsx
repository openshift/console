import * as React from 'react';
import * as _ from 'lodash-es';

import { DeploymentModel } from '../models';
import { configureUpdateStrategyModal } from './modals';
import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { Cog, DeploymentPodCounts, SectionHeading, LoadingInline, navFactory, Overflow, pluralize, ResourceSummary } from './utils';
import { Conditions } from './conditions';
import { EnvironmentPage } from './environment';
import { ResourceEventStream } from './events';
import { formatDuration } from './utils/datetime';

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

const ContainerRow = ({container}) => {
  const resourceLimits = _.get(container, 'resources.limits');
  const ports = _.get(container, 'ports');
  return <div className="row">
    <div className="col-xs-6 col-sm-4 col-md-3">
      {container.name}
    </div>
    <Overflow className="col-xs-6 col-sm-4 col-md-3" value={container.image} />
    <div className="col-sm-4 col-md-3 hidden-xs">{_.map(resourceLimits, (v, k) => `${k}: ${v}`).join(', ') || '-'}</div>
    <Overflow className="col-md-3 hidden-xs hidden-sm" value={_.map(ports, port => `${port.containerPort}/${port.protocol}`).join(', ')} />
  </div>;
};

export const ContainerTable = ({containers}) => <div className="co-m-table-grid co-m-table-grid--bordered">
  <div className="row co-m-table-grid__head">
    <div className="col-xs-6 col-sm-4 col-md-3">Name</div>
    <div className="col-xs-6 col-sm-4 col-md-3">Image</div>
    <div className="col-sm-4 col-md-3 hidden-xs">Resource Limits</div>
    <div className="col-md-3 hidden-xs hidden-sm">Ports</div>
  </div>
  <div className="co-m-table-grid__body">
    {_.map(containers, (c, i) => <ContainerRow key={i} container={c} />)}
  </div>
</div>;

const DeploymentDetails = ({obj: deployment}) => {
  const isRecreate = (deployment.spec.strategy.type === 'Recreate');
  const progressDeadlineSeconds = _.get(deployment, 'spec.progressDeadlineSeconds');

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
            <dl className="co-m-pane__details">
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
            </dl>
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
