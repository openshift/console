import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { k8sCreate, K8sResourceKindReference } from '../module/k8s';
import { errorModal } from './modals';
import { DeploymentConfigModel } from '../models';
import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { Cog, DeploymentPodCounts, SectionHeading, LoadingInline, navFactory, pluralize, ResourceSummary } from './utils';
import { Conditions } from './conditions';
import { EnvironmentPage } from './environment';
import { ResourceEventStream } from './events';
import { ContainerTable } from './deployment';

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

export const DeploymentConfigsDetails: React.SFC<{obj: any}> = ({obj: deploymentConfig}) => {
  const reason = _.get(deploymentConfig, 'status.details.message');
  const timeout = _.get(deploymentConfig, 'spec.strategy.rollingParams.timeoutSeconds');
  const updatePeriod = _.get(deploymentConfig, 'spec.strategy.rollingParams.updatePeriodSeconds');
  const interval = _.get(deploymentConfig, 'spec.strategy.rollingParams.intervalSeconds');
  const isRecreate = 'Recreate' === _.get(deploymentConfig, 'spec.strategy.type');
  const triggers = _.map(deploymentConfig.spec.triggers, 'type').join(', ');

  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Deployment Config Overview" />
      <DeploymentPodCounts resource={deploymentConfig} resourceKind={DeploymentConfigModel} />
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={deploymentConfig}>
              <dt>Status</dt>
              <dd>{deploymentConfig.status.availableReplicas === deploymentConfig.status.updatedReplicas ? <span>Active</span> : <div><span className="co-icon-space-r"><LoadingInline /></span> Updating</div>}</dd>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <dt>Latest Version</dt>
              <dd>{_.get(deploymentConfig, 'status.latestVersion', '-')}</dd>
              {reason && <dt>Reason</dt>}
              {reason && <dd>{reason}</dd>}
              <dt>Update Strategy</dt>
              <dd>{_.get(deploymentConfig, 'spec.strategy.type', 'Rolling')}</dd>
              {timeout && <dt>Timeout</dt>}
              {timeout && <dd>{pluralize(timeout, 'second')}</dd>}
              {updatePeriod && <dt>Update Period</dt>}
              {updatePeriod && <dd>{pluralize(updatePeriod, 'second')}</dd>}
              {interval && <dt>Interval</dt>}
              {interval && <dd>{pluralize(interval, 'second')}</dd>}
              {isRecreate || <dt>Max Unavailable</dt>}
              {isRecreate || <dd>{_.get(deploymentConfig, 'spec.strategy.rollingParams.maxUnavailable', 1)} of {pluralize(deploymentConfig.spec.replicas, 'pod')}</dd>}
              {isRecreate || <dt>Max Surge</dt>}
              {isRecreate || <dd>{_.get(deploymentConfig, 'spec.strategy.rollingParams.maxSurge', 1)} greater than {pluralize(deploymentConfig.spec.replicas, 'pod')}</dd>}
              <dt>Min Ready Seconds</dt>
              <dd>{deploymentConfig.spec.minReadySeconds ? pluralize(deploymentConfig.spec.minReadySeconds, 'second') : 'Not Configured'}</dd>
              {triggers && <dt>Triggers</dt>}
              {triggers && <dd>{triggers}</dd>}
            </dl>
          </div>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
      <ContainerTable containers={deploymentConfig.spec.template.spec.containers} />
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={deploymentConfig.status.conditions} />
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

export const DeploymentConfigsPage: React.SFC<DeploymentConfigsPageProps> = props =>
  <ListPage {...props} title="Deployment Configs" kind={DeploymentConfigsReference} ListComponent={DeploymentConfigsList} canCreate={true} filterLabel={props.filterLabel} />;
DeploymentConfigsPage.displayName = 'DeploymentConfigsListPage';

/* eslint-disable no-undef */
export type DeploymentConfigsRowProps = {
  obj: any,
};

export type DeploymentConfigsPageProps = {
  filterLabel: string,
};

export type DeploymentConfigsDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */
