import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { k8sCreate, K8sResourceKindReference } from '../module/k8s';
import { errorModal } from './modals';
import { DeploymentConfigModel } from '../models';
import { DetailsPage, List, ListPage, WorkloadListHeader, WorkloadListRow } from './factory';
import { Cog, DeploymentPodCounts, navFactory, LoadingInline, pluralize, ResourceSummary } from './utils';
import { registerTemplate } from '../yaml-templates';
import { Conditions } from './conditions';
import { EnvironmentPage } from './environment';

registerTemplate('apps.openshift.io/v1.DeploymentConfig', `apiVersion: apps.openshift.io/v1
kind: DeploymentConfig
metadata:
  name: example
spec:
  selector:
    app: hello-openshift
  replicas: 3
  template:
    metadata:
      labels:
        app: hello-openshift
    spec:
      containers:
      - name: hello-openshift
        image: openshift/hello-openshift
        ports:
        - containerPort: 8080`);

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
  label: 'Rollout',
  callback: () => rollout(obj).catch(err => {
    const error = err.message;
    errorModal({error});
  }),
});

const {ModifyCount, ModifyNodeSelector, EditEnvironment, common} = Cog.factory;

const menuActions = [
  rolloutAction,
  ModifyCount,
  ModifyNodeSelector,
  EditEnvironment,
  ...common,
];

export const DeploymentConfigsDetails: React.SFC<{obj: any}> = ({obj: deploymentConfig}) => {
  const isRecreate = 'Recreate' === _.get(deploymentConfig, 'spec.strategy.type');
  const reason = _.get(deploymentConfig, 'status.details.message');

  return <React.Fragment>
    <div className="co-m-pane__body">
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
              {isRecreate || <dt>Max Unavailable</dt>}
              {isRecreate || <dd>{_.get(deploymentConfig, 'spec.strategy.rollingParams.maxUnavailable', 1)} of {pluralize(deploymentConfig.spec.replicas, 'pod')}</dd>}
              {isRecreate || <dt>Max Surge</dt>}
              {isRecreate || <dd>{_.get(deploymentConfig, 'spec.strategy.rollingParams.maxSurge', 1)} greater than {pluralize(deploymentConfig.spec.replicas, 'pod')}</dd>}
              <dt>Min Ready Seconds</dt>
              <dd>{deploymentConfig.spec.minReadySeconds ? pluralize(deploymentConfig.spec.minReadySeconds, 'second') : 'Not Configured'}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <h1 className="co-section-title">Conditions</h1>
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

const pages = [navFactory.details(DeploymentConfigsDetails), navFactory.editYaml(), navFactory.pods(), navFactory.envEditor(environmentComponent)];
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
