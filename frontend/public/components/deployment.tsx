import * as React from 'react';

import { Status, PodRingController } from '@console/shared';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { DeploymentModel } from '../models';
import { DeploymentKind, K8sKind, K8sResourceKindReference } from '../module/k8s';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { configureUpdateStrategyModal, errorModal } from './modals';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DetailsPage, ListPage, Table, RowFunction } from './factory';
import { AsyncComponent, DetailsItem, Kebab, KebabAction, ContainerTable, navFactory, pluralize, ResourceSummary, SectionHeading, togglePaused, WorkloadPausedAlert, LoadingInline } from './utils';
import { ReplicaSetsPage } from './replicaset';
import { WorkloadTableRow, WorkloadTableHeader } from './workload-table';

const deploymentsReference: K8sResourceKindReference = 'Deployment';
const { ModifyCount, AddStorage, common } = Kebab.factory;

const UpdateStrategy: KebabAction = (kind: K8sKind, deployment: DeploymentKind) => {
  const { t } = useTranslation();
  return {
    label: t('COMMON:MSG_MAIN_ACTIONBUTTON_8'),
    callback: () => configureUpdateStrategyModal({ deployment }),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: deployment.metadata.name,
      namespace: deployment.metadata.namespace,
      verb: 'patch',
    },
  };
};

const PauseAction: KebabAction = (kind: K8sKind, obj: DeploymentKind) => {
  const { t } = useTranslation();
  return {
    label: obj.spec.paused ? 'Resume Rollouts' : t('COMMON:MSG_MAIN_ACTIONBUTTON_12'),
    callback: () => togglePaused(kind, obj).catch(err => errorModal({ error: err.message })),
    accessReview: {
      group: kind.apiGroup,
      resource: kind.plural,
      name: obj.metadata.name,
      namespace: obj.metadata.namespace,
      verb: 'patch',
    },
  };
};

export const menuActions = [ModifyCount, PauseAction, AddHealthChecks, AddStorage, UpdateStrategy, ...Kebab.getExtensionsActionsForKind(DeploymentModel), EditHealthChecks, ...common];

export const DeploymentDetailsList: React.FC<DeploymentDetailsListProps> = ({ deployment }) => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details">
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_25')} obj={deployment} path="spec.strategy.type" />
      {deployment.spec.strategy.type === 'RollingUpdate' && (
        <>
          <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_26')} obj={deployment} path="spec.strategy.rollingUpdate.maxUnavailable">
            {deployment.spec.strategy.rollingUpdate.maxUnavailable || 1} of {pluralize(deployment.spec.replicas, 'pod')}
          </DetailsItem>
          <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_27')} obj={deployment} path="spec.strategy.rollingUpdate.maxSurge">
            {deployment.spec.strategy.rollingUpdate.maxSurge || 1} greater than {pluralize(deployment.spec.replicas, 'pod')}
          </DetailsItem>
        </>
      )}
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_28')} obj={deployment} path="spec.progressDeadlineSeconds">
        {deployment.spec.progressDeadlineSeconds ? pluralize(deployment.spec.progressDeadlineSeconds, 'second') : 'Not Configured'}
      </DetailsItem>
      <DetailsItem label={t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_29')} obj={deployment} path="spec.minReadySeconds">
        {deployment.spec.minReadySeconds ? pluralize(deployment.spec.minReadySeconds, 'second') : 'Not Configured'}
      </DetailsItem>
    </dl>
  );
};
DeploymentDetailsList.displayName = 'DeploymentDetailsList';

const DeploymentDetails: React.FC<DeploymentDetailsProps> = ({ obj: deployment }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={`${t('COMMON:MSG_LNB_MENU_24')} ${t('COMMON:MSG_DETAILS_TABOVERVIEW_1')}`} />
        {deployment.spec.paused && <WorkloadPausedAlert obj={deployment} model={DeploymentModel} />}
        <PodRingController
          namespace={deployment.metadata.namespace}
          kind={deployment.kind}
          render={d => {
            return d.loaded ? <PodRingSet key={deployment.metadata.uid} podData={d.data[deployment.metadata.uid]} obj={deployment} resourceKind={DeploymentModel} path="/spec/replicas" /> : <LoadingInline />;
          }}
        />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={deployment} showPodSelector showNodeSelector showTolerations>
                <dt>{t('COMMON:MSG_DETAILS_TABDETAILS_DETAILS_13')}</dt>
                <dd>{deployment.status.availableReplicas === deployment.status.updatedReplicas && deployment.spec.replicas === deployment.status.availableReplicas ? <Status status="Up to date" /> : <Status status="Updating" />}</dd>
              </ResourceSummary>
            </div>
            <div className="col-sm-6">
              <DeploymentDetailsList deployment={deployment} />
            </div>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_CONTAINERS_TABLEHEADER_1')} />
        <ContainerTable containers={deployment.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={deployment} heading={t('COMMON:MSG_DETAILS_TABDETAILS_VOLUMES_TABLEHEADER_1')} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('COMMON:MSG_DETAILS_TABDETAILS_CONDITIONS_1')} />
        <Conditions conditions={deployment.status.conditions} />
      </div>
    </>
  );
};
DeploymentDetails.displayName = 'DeploymentDetails';

const EnvironmentPage = props => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

const envPath = ['spec', 'template', 'spec', 'containers'];
const environmentComponent = props => <EnvironmentPage obj={props.obj} rawEnvData={props.obj.spec.template.spec} envPath={envPath} readOnly={false} />;

const ReplicaSetsTab: React.FC<ReplicaSetsTabProps> = ({ obj }) => {
  const {
    metadata: { namespace },
    spec: { selector },
  } = obj;

  // Hide the create button to avoid confusion when showing replica sets for an object.
  return <ReplicaSetsPage showTitle={false} namespace={namespace} selector={selector} canCreate={false} />;
};

const { details, editYaml, pods, envEditor, events } = navFactory;
export const DeploymentsDetailsPage: React.FC<DeploymentsDetailsPageProps> = props => {
  const { t } = useTranslation();
  return (
    <DetailsPage
      {...props}
      kind={deploymentsReference}
      menuActions={menuActions}
      pages={[
        details(DeploymentDetails),
        editYaml(),
        {
          href: 'replicasets',
          name: t('COMMON:MSG_LNB_MENU_31'),
          component: ReplicaSetsTab,
        },
        pods(),
        envEditor(environmentComponent),
        events(ResourceEventStream),
      ]}
    />
  );
};
DeploymentsDetailsPage.displayName = 'DeploymentsDetailsPage';

type DeploymentDetailsListProps = {
  deployment: DeploymentKind;
};

type DeploymentDetailsProps = {
  obj: DeploymentKind;
};

const kind = 'Deployment';

const DeploymentTableRow: RowFunction<DeploymentKind> = ({ obj, index, key, style }) => {
  return <WorkloadTableRow obj={obj} index={index} rowKey={key} style={style} menuActions={menuActions} kind={kind} />;
};

const DeploymentTableHeader = (t?: TFunction) => {
  return WorkloadTableHeader(t);
};
DeploymentTableHeader.displayName = 'DeploymentTableHeader';

export const DeploymentsList: React.FC = props => {
  const { t } = useTranslation();
  return <Table {...props} aria-label="Deployments" Header={DeploymentTableHeader.bind(null, t)} Row={DeploymentTableRow} virtualize />;
};
DeploymentsList.displayName = 'DeploymentsList';

export const DeploymentsPage: React.FC<DeploymentsPageProps> = props => <ListPage kind={deploymentsReference} canCreate={true} ListComponent={DeploymentsList} {...props} />;
DeploymentsPage.displayName = 'DeploymentsPage';

type ReplicaSetsTabProps = {
  obj: DeploymentKind;
};

type DeploymentsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type DeploymentsDetailsPageProps = {
  match: any;
};
