import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { k8sCreate, K8sResourceKindReference } from '../module/k8s';
import { errorModal } from './modals';
import { DeploymentConfigModel } from '../models';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
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

const DeploymentConfigsReference: K8sResourceKindReference = 'DeploymentConfig';

const rollout = dc => {
  const req = {
    kind: 'DeploymentRequest',
    apiVersion: 'apps.openshift.io/v1',
    name: dc.metadata.name,
    latest: true,
    force: true,
  };
  const opts = {
    name: dc.metadata.name,
    ns: dc.metadata.namespace,
    path: 'instantiate',
  };
  return k8sCreate(DeploymentConfigModel, req, opts);
};

const rolloutAction = (kind, obj) => ({
  label: 'Start Rollout',
  callback: () => rollout(obj).catch(err => {
    const error = err.message;
    errorModal({error});
  }),
});

const {ModifyCount, EditEnvironment, common} = Cog.factory;

const menuActions = [
  rolloutAction,
  ModifyCount,
  EditEnvironment,
  ...common,
];

const DeploymentConfigDetailsList = ({dc}) => {
  const reason = _.get(dc, 'status.details.message');
  const timeout = _.get(dc, 'spec.strategy.rollingParams.timeoutSeconds');
  const updatePeriod = _.get(dc, 'spec.strategy.rollingParams.updatePeriodSeconds');
  const interval = _.get(dc, 'spec.strategy.rollingParams.intervalSeconds');
  const isRecreate = 'Recreate' === _.get(dc, 'spec.strategy.type');
  const triggers = _.map(dc.spec.triggers, 'type').join(', ');
  return <dl className="co-m-pane__details">
    <dt>Latest Version</dt>
    <dd>{_.get(dc, 'status.latestVersion', '-')}</dd>
    {reason && <dt>Reason</dt>}
    {reason && <dd>{reason}</dd>}
    <dt>Update Strategy</dt>
    <dd>{_.get(dc, 'spec.strategy.type', 'Rolling')}</dd>
    {timeout && <dt>Timeout</dt>}
    {timeout && <dd>{pluralize(timeout, 'second')}</dd>}
    {updatePeriod && <dt>Update Period</dt>}
    {updatePeriod && <dd>{pluralize(updatePeriod, 'second')}</dd>}
    {interval && <dt>Interval</dt>}
    {interval && <dd>{pluralize(interval, 'second')}</dd>}
    {isRecreate || <dt>Max Unavailable</dt>}
    {isRecreate || <dd>{_.get(dc, 'spec.strategy.rollingParams.maxUnavailable', 1)} of {pluralize(dc.spec.replicas, 'pod')}</dd>}
    {isRecreate || <dt>Max Surge</dt>}
    {isRecreate || <dd>{_.get(dc, 'spec.strategy.rollingParams.maxSurge', 1)} greater than {pluralize(dc.spec.replicas, 'pod')}</dd>}
    <dt>Min Ready Seconds</dt>
    <dd>{dc.spec.minReadySeconds ? pluralize(dc.spec.minReadySeconds, 'second') : 'Not Configured'}</dd>
    {triggers && <dt>Triggers</dt>}
    {triggers && <dd>{triggers}</dd>}
  </dl>;
};

export const DeploymentConfigOverview = connectToModel(({resource: dc, kindObj}) =>
  <div className="co-m-pane resource-overview">
    <ResourceOverviewHeading
      actions={menuActions}
      kindObj={kindObj}
      resource={dc}
    />
    <div className="co-m-pane__body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <DeploymentPodCounts resource={dc} resourceKind={DeploymentConfigModel} sidebar={true} />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={dc}>
          <dt>Status</dt>
          <dd>{dc.status.availableReplicas === dc.status.updatedReplicas ? <span>Active</span> : <div><span className="co-icon-space-r"><LoadingInline /></span> Updating</div>}</dd>
        </ResourceSummary>
      </div>
      <div className="resource-overview__details">
        <DeploymentConfigDetailsList dc={dc} />
      </div>
    </div>
  </div>);

export const DeploymentConfigsDetails: React.SFC<{obj: any}> = ({obj: dc}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Deployment Config Overview" />
      <DeploymentPodCounts resource={dc} resourceKind={DeploymentConfigModel} />
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={dc}>
              <dt>Status</dt>
              <dd>{dc.status.availableReplicas === dc.status.updatedReplicas ? <span>Active</span> : <div><span className="co-icon-space-r"><LoadingInline /></span> Updating</div>}</dd>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <DeploymentConfigDetailsList dc={dc} />
          </div>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
      <ContainerTable containers={dc.spec.template.spec.containers} />
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={dc.status.conditions} />
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

const pages = [
  navFactory.details(DeploymentConfigsDetails),
  navFactory.editYaml(),
  navFactory.pods(),
  navFactory.envEditor(environmentComponent),
  navFactory.events(ResourceEventStream)
];

export const DeploymentConfigsDetailsPage: React.SFC<DeploymentConfigsDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={DeploymentConfigsReference} menuActions={menuActions} pages={pages} />;
};
DeploymentConfigsDetailsPage.displayName = 'DeploymentConfigsDetailsPage';

const DeploymentConfigsRow: React.SFC<DeploymentConfigsRowProps> = props => {
  return <WorkloadListRow {...props} kind="DeploymentConfig" actions={menuActions} />;
};
export const DeploymentConfigsList: React.SFC = props => <List {...props} Header={WorkloadListHeader} Row={DeploymentConfigsRow} />;
DeploymentConfigsList.displayName = 'DeploymentConfigsList';

export const DeploymentConfigsPage: React.SFC<DeploymentConfigsPageProps> = props => {
  const createItems = {
    image: 'From Image',
    yaml: 'From YAML',
  };

  const createProps = {
    items: createItems,
    createLink: type => type === 'image'
      ? `/deploy-image${props.namespace ? `?preselected-ns=${props.namespace}` : ''}`
      : `/k8s/ns/${props.namespace || 'default'}/deploymentconfigs/new`
  };
  return <ListPage {...props} title="Deployment Configs" kind={DeploymentConfigsReference} ListComponent={DeploymentConfigsList} canCreate={true} createButtonText="Create" createProps={createProps} filterLabel={props.filterLabel} />;
};
DeploymentConfigsPage.displayName = 'DeploymentConfigsListPage';

/* eslint-disable no-undef */
export type DeploymentConfigsRowProps = {
  obj: any,
};

export type DeploymentConfigsPageProps = {
  filterLabel: string,
  namespace: string,
};

export type DeploymentConfigsDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */
