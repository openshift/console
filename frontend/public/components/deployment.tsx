import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActionServiceProvider, ActionMenu, ActionMenuVariant, Status } from '@console/shared';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { EditResourceLimits } from '@console/app/src/actions/edit-resource-limits';
import {
  AddHorizontalPodAutoScaler,
  DeleteHorizontalPodAutoScaler,
  EditHorizontalPodAutoScaler,
  hideActionForHPAs,
} from '@console/app/src/actions/modify-hpa';
import { DeploymentModel } from '../models';
import {
  DeploymentKind,
  K8sKind,
  K8sResourceKindReference,
  referenceFor,
  referenceForModel,
} from '../module/k8s';
import { configureUpdateStrategyModal, errorModal } from './modals';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DetailsPage, ListPage, Table, RowFunction } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  Kebab,
  KebabAction,
  ContainerTable,
  navFactory,
  ResourceSummary,
  SectionHeading,
  togglePaused,
  WorkloadPausedAlert,
  RuntimeClass,
} from './utils';
import { ReplicaSetsPage } from './replicaset';
import { WorkloadTableRow, WorkloadTableHeader } from './workload-table';

const deploymentsReference: K8sResourceKindReference = 'Deployment';
const { ModifyCount, AddStorage, common } = Kebab.factory;

const UpdateStrategy: KebabAction = (kind: K8sKind, deployment: DeploymentKind) => ({
  // t('public~Edit update strategy')
  labelKey: 'public~Edit update strategy',
  callback: () => configureUpdateStrategyModal({ deployment }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: deployment.metadata.name,
    namespace: deployment.metadata.namespace,
    verb: 'patch',
  },
});

const PauseAction: KebabAction = (kind: K8sKind, obj: DeploymentKind) => ({
  // t('public~Resume rollouts')
  // t('public~Pause rollouts')
  labelKey: obj.spec.paused ? 'public~Resume rollouts' : 'public~Pause rollouts',
  callback: () => togglePaused(kind, obj).catch((err) => errorModal({ error: err.message })),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});

export const menuActions = [
  hideActionForHPAs(ModifyCount),
  PauseAction,
  AddHealthChecks,
  AddHorizontalPodAutoScaler,
  EditHorizontalPodAutoScaler,
  AddStorage,
  UpdateStrategy,
  DeleteHorizontalPodAutoScaler,
  EditResourceLimits,
  ...Kebab.getExtensionsActionsForKind(DeploymentModel),
  EditHealthChecks,
  ...common,
];

export const DeploymentDetailsList: React.FC<DeploymentDetailsListProps> = ({ deployment }) => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details">
      <DetailsItem label={t('public~Update strategy')} obj={deployment} path="spec.strategy.type" />
      {deployment.spec.strategy.type === 'RollingUpdate' && (
        <>
          <DetailsItem
            label={t('public~Max unavailable')}
            obj={deployment}
            path="spec.strategy.rollingUpdate.maxUnavailable"
          >
            {t('public~{{maxUnavailable}} of {{count}} pod', {
              maxUnavailable: deployment.spec.strategy.rollingUpdate.maxUnavailable ?? 1,
              count: deployment.spec.replicas,
            })}
          </DetailsItem>
          <DetailsItem
            label={t('public~Max surge')}
            obj={deployment}
            path="spec.strategy.rollingUpdate.maxSurge"
          >
            {t('public~{{maxSurge}} greater than {{count}} pod', {
              maxSurge: deployment.spec.strategy.rollingUpdate.maxSurge ?? 1,
              count: deployment.spec.replicas,
            })}
          </DetailsItem>
        </>
      )}
      <DetailsItem
        label={t('public~Progress deadline seconds')}
        obj={deployment}
        path="spec.progressDeadlineSeconds"
      >
        {deployment.spec.progressDeadlineSeconds
          ? t('public~{{count}} second', { count: deployment.spec.progressDeadlineSeconds })
          : t('public~Not configured')}
      </DetailsItem>
      <DetailsItem
        label={t('public~Min ready seconds')}
        obj={deployment}
        path="spec.minReadySeconds"
      >
        {deployment.spec.minReadySeconds
          ? t('public~{{count}} second', { count: deployment.spec.minReadySeconds })
          : t('public~Not configured')}
      </DetailsItem>
      <RuntimeClass obj={deployment} />
    </dl>
  );
};
DeploymentDetailsList.displayName = 'DeploymentDetailsList';

const DeploymentDetails: React.FC<DeploymentDetailsProps> = ({ obj: deployment }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Deployment details')} />
        {deployment.spec.paused && <WorkloadPausedAlert obj={deployment} model={DeploymentModel} />}
        <PodRingSet key={deployment.metadata.uid} obj={deployment} path="/spec/replicas" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary
                resource={deployment}
                showPodSelector
                showNodeSelector
                showTolerations
              >
                <dt>{t('public~Status')}</dt>
                <dd>
                  {deployment.status.availableReplicas === deployment.status.updatedReplicas &&
                  deployment.spec.replicas === deployment.status.availableReplicas ? (
                    <Status status="Up to date" />
                  ) : (
                    <Status status="Updating" />
                  )}
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
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={deployment.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={deployment} heading={t('public~Volumes')} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={deployment.status.conditions} />
      </div>
    </>
  );
};
DeploymentDetails.displayName = 'DeploymentDetails';

const EnvironmentPage = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'template', 'spec', 'containers'];
const environmentComponent = (props) => (
  <EnvironmentPage
    obj={props.obj}
    rawEnvData={props.obj.spec.template.spec}
    envPath={envPath}
    readOnly={false}
  />
);

const ReplicaSetsTab: React.FC<ReplicaSetsTabProps> = ({ obj }) => {
  const {
    metadata: { namespace },
    spec: { selector },
  } = obj;

  // Hide the create button to avoid confusion when showing replica sets for an object.
  return (
    <ReplicaSetsPage
      showTitle={false}
      namespace={namespace}
      selector={selector}
      canCreate={false}
    />
  );
};

const { details, editYaml, pods, envEditor, events, metrics } = navFactory;
export const DeploymentsDetailsPage: React.FC<DeploymentsDetailsPageProps> = (props) => {
  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceForModel(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };

  // t('public~ReplicaSets')
  return (
    <DetailsPage
      {...props}
      kind={deploymentsReference}
      customActionMenu={customActionMenu}
      pages={[
        details(DeploymentDetails),
        metrics(),
        editYaml(),
        {
          href: 'replicasets',
          nameKey: 'public~ReplicaSets',
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

const DeploymentTableRow: RowFunction<DeploymentKind> = ({ obj, index, key, style, ...props }) => {
  const resourceKind = referenceFor(obj);
  const context = { [resourceKind]: obj };
  const customActionMenu = (
    <ActionServiceProvider context={context}>
      {({ actions, options, loaded }) =>
        loaded && <ActionMenu actions={actions} options={options} />
      }
    </ActionServiceProvider>
  );
  return (
    <WorkloadTableRow
      obj={obj}
      index={index}
      rowKey={key}
      style={style}
      customActionMenu={customActionMenu}
      kind={kind}
      {...props}
    />
  );
};

const DeploymentTableHeader = () => {
  return WorkloadTableHeader();
};
DeploymentTableHeader.displayName = 'DeploymentTableHeader';

export const DeploymentsList: React.FC = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('public~Deployments')}
      Header={DeploymentTableHeader}
      Row={DeploymentTableRow}
      virtualize
    />
  );
};
DeploymentsList.displayName = 'DeploymentsList';

export const DeploymentsPage: React.FC<DeploymentsPageProps> = (props) => {
  return (
    <ListPage
      kind={deploymentsReference}
      canCreate={true}
      ListComponent={DeploymentsList}
      {...props}
    />
  );
};
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
