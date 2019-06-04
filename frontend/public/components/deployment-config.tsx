import * as React from 'react';
import * as _ from 'lodash-es';

import { k8sCreate, K8sKind, K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { errorModal } from './modals';
import { DeploymentConfigModel } from '../models';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import {
  DetailsPage,
  List,
  ListPage,
  WorkloadListHeader,
  WorkloadListRow,
} from './factory';
import {
  AsyncComponent,
  history,
  Kebab,
  KebabAction,
  ContainerTable,
  DeploymentPodCounts,
  navFactory,
  pluralize,
  ResourceSummary,
  resourcePath,
  SectionHeading,
  togglePaused,
  WorkloadPausedAlert,
  StatusIconAndText,
} from './utils';

const DeploymentConfigsReference: K8sResourceKindReference = 'DeploymentConfig';

const rollout = (dc: K8sResourceKind): Promise<K8sResourceKind> => {
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

const determineReplicationControllerName = (dc: K8sResourceKind): string => {
  return `${dc.metadata.name}-${dc.status.latestVersion}`;
};

const RolloutAction: KebabAction = (kind: K8sKind, obj: K8sResourceKind) => ({
  label: 'Start Rollout',
  callback: () => rollout(obj).then(deployment => {
    history.push(resourcePath('ReplicationController', determineReplicationControllerName(deployment), deployment.metadata.namespace));
  }).catch(err => {
    const error = err.message;
    errorModal({error});
  }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.path,
    subresource: 'instantiate',
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'create',
  },
});

const PauseAction: KebabAction = (kind: K8sKind, obj: K8sResourceKind) => ({
  label: obj.spec.paused ? 'Resume Rollouts' : 'Pause Rollouts',
  callback: () => togglePaused(kind, obj).catch((err) => errorModal({error: err.message})),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.path,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

const {ModifyCount, AddStorage, EditEnvironment, common} = Kebab.factory;

export const menuActions: KebabAction[] = [
  RolloutAction,
  PauseAction,
  ModifyCount,
  AddStorage,
  EditEnvironment,
  ...common,
];

export const DeploymentConfigDetailsList = ({dc}) => {
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

export const DeploymentConfigsDetails: React.FC<{obj: K8sResourceKind}> = ({obj: dc}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Deployment Config Overview" />
      {dc.spec.paused && <WorkloadPausedAlert obj={dc} model={DeploymentConfigModel} />}
      <DeploymentPodCounts resource={dc} resourceKind={DeploymentConfigModel} />
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={dc} showPodSelector showNodeSelector showTolerations>
              <dt>Status</dt>
              <dd>
                {dc.status.availableReplicas === dc.status.updatedReplicas && dc.spec.replicas === dc.status.availableReplicas
                  ? <StatusIconAndText status="Up to date" />
                  : <StatusIconAndText status="Updating" />}
              </dd>
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
      <VolumesTable podTemplate={dc.spec.template} heading="Volumes" />
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
  rawEnvData={props.obj.spec.template.spec}
  envPath={envPath}
  readOnly={false}
/>;

const pages = [
  navFactory.details(DeploymentConfigsDetails),
  navFactory.editYaml(),
  navFactory.pods(),
  navFactory.envEditor(environmentComponent),
  navFactory.events(ResourceEventStream),
];

export const DeploymentConfigsDetailsPage: React.FC<DeploymentConfigsDetailsPageProps> = props => {
  return <DetailsPage {...props} kind={DeploymentConfigsReference} menuActions={menuActions} pages={pages} />;
};
DeploymentConfigsDetailsPage.displayName = 'DeploymentConfigsDetailsPage';

const DeploymentConfigsRow: React.FC<DeploymentConfigsRowProps> = props => {
  return <WorkloadListRow {...props} kind="DeploymentConfig" actions={menuActions} />;
};
export const DeploymentConfigsList: React.FC = props => <List {...props} Header={WorkloadListHeader} Row={DeploymentConfigsRow} />;
DeploymentConfigsList.displayName = 'DeploymentConfigsList';

export const DeploymentConfigsPage: React.FC<DeploymentConfigsPageProps> = props => {
  const createItems = {
    image: 'From Image',
    yaml: 'From YAML',
  };

  const createProps = {
    items: createItems,
    createLink: (type: string) => type === 'image'
      ? `/deploy-image${props.namespace ? `?preselected-ns=${props.namespace}` : ''}`
      : `/k8s/ns/${props.namespace || 'default'}/deploymentconfigs/~new`,
  };
  return <ListPage {...props} title="Deployment Configs" kind={DeploymentConfigsReference} ListComponent={DeploymentConfigsList} canCreate={true} createButtonText="Create" createProps={createProps} filterLabel={props.filterLabel} />;
};
DeploymentConfigsPage.displayName = 'DeploymentConfigsListPage';

type DeploymentConfigsRowProps = {
  obj: K8sResourceKind;
};

type DeploymentConfigsPageProps = {
  filterLabel: string;
  namespace: string;
};

type DeploymentConfigsDetailsPageProps = {
  match: any;
};
