import * as React from 'react';
import * as _ from 'lodash-es';

import { Status, PodRingController, PodRing } from '@console/shared';
import { DeploymentModel } from '../models';
import { K8sKind, K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { configureUpdateStrategyModal, errorModal } from './modals';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { formatDuration } from './utils/datetime';
import { VolumesTable } from './volumes-table';
import {
  DetailsPage,
  ListPage,
  Table,
} from './factory';
import {
  AsyncComponent,
  Kebab,
  KebabAction,
  ContainerTable,
  navFactory,
  pluralize,
  ResourceSummary,
  SectionHeading,
  togglePaused,
  WorkloadPausedAlert,
  LoadingInline,
} from './utils';

import {
  WorkloadTableRow,
  WorkloadTableHeader,
} from './workload-table';

const deploymentsReference: K8sResourceKindReference = 'Deployment';
const {ModifyCount, AddStorage, common} = Kebab.factory;

const UpdateStrategy: KebabAction = (kind: K8sKind, deployment: K8sResourceKind) => ({
  label: 'Edit Update Strategy',
  callback: () => configureUpdateStrategyModal({deployment}),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: deployment.metadata.name,
    namespace: deployment.metadata.namespace,
    verb: 'patch',
  },
});

const PauseAction: KebabAction = (kind: K8sKind, obj: K8sResourceKind) => ({
  label: obj.spec.paused ? 'Resume Rollouts' : 'Pause Rollouts',
  callback: () => togglePaused(kind, obj).catch((err) => errorModal({error: err.message})),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

export const menuActions = [
  ModifyCount,
  PauseAction,
  AddStorage,
  UpdateStrategy,
  ...common,
];

export const DeploymentDetailsList: React.FC<DeploymentDetailsListProps> = ({deployment}) => {
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
DeploymentDetailsList.displayName = 'DeploymentDetailsList';

const DeploymentDetails: React.FC<DeploymentDetailsProps> = ({obj: deployment}) => {
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Deployment Overview" />
      {deployment.spec.paused && <WorkloadPausedAlert obj={deployment} model={DeploymentModel} />}
      <PodRingController
        namespace={deployment.metadata.namespace}
        kind={deployment.kind}
        render={(d) => {
          return d.loaded ? <PodRing pods={d.data[deployment.metadata.uid].pods}
            obj={deployment}
            resourceKind={DeploymentModel}
            path="/spec/replicas" /> : <LoadingInline />;
        }}
      />
      <div className="co-m-pane__body-group">
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={deployment} showPodSelector showNodeSelector showTolerations>
              <dt>Status</dt>
              <dd>
                {deployment.status.availableReplicas === deployment.status.updatedReplicas && deployment.spec.replicas === deployment.status.availableReplicas
                  ? <Status status="Up to date" />
                  : <Status status="Updating" />}
              </dd>
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
      <VolumesTable resource={deployment} heading="Volumes" />
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={deployment.status.conditions} />
    </div>
  </React.Fragment>;
};
DeploymentDetails.displayName = 'DeploymentDetails';

const EnvironmentPage = (props) => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

const envPath = ['spec','template','spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.template.spec}
  envPath={envPath}
  readOnly={false}
/>;

const {details, editYaml, pods, envEditor, events} = navFactory;
export const DeploymentsDetailsPage: React.FC<DeploymentsDetailsPageProps> = props => <DetailsPage
  {...props}
  kind={deploymentsReference}
  menuActions={menuActions}
  pages={[details(DeploymentDetails), editYaml(), pods(), envEditor(environmentComponent), events(ResourceEventStream)]}
/>;
DeploymentsDetailsPage.displayName = 'DeploymentsDetailsPage';

type DeploymentDetailsListProps = {
  deployment: K8sResourceKind;
};

type DeploymentDetailsProps = {
  obj: K8sResourceKind;
};

const kind = 'Deployment';

const DeploymentTableRow: React.FC<DeploymentTableRowProps> = ({obj, index, key, style}) => {
  return (
    <WorkloadTableRow obj={obj} index={index} key={key} style={style} menuActions={menuActions} kind={kind} />
  );
};
DeploymentTableRow.displayName = 'DeploymentTableRow';
type DeploymentTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key: string;
  style: object;
}

const DeploymentTableHeader = () => {
  return WorkloadTableHeader();
};
DeploymentTableHeader.displayName = 'DeploymentTableHeader';

export const DeploymentsList: React.FC = props => <Table {...props} aria-label="Deployments" Header={DeploymentTableHeader} Row={DeploymentTableRow} virtualize />;
DeploymentsList.displayName = 'DeploymentsList';

export const DeploymentsPage: React.FC<DeploymentsPageProps> = props => <ListPage kind={deploymentsReference} canCreate={true} ListComponent={DeploymentsList} {...props} />;
DeploymentsPage.displayName = 'DeploymentsPage';

type DeploymentsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type DeploymentsDetailsPageProps = {
  match: any;
};
