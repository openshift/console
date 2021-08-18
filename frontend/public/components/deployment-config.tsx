import * as React from 'react';
import * as _ from 'lodash-es';
import {
  Status,
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  LazyActionMenu,
} from '@console/shared';
import { useTranslation } from 'react-i18next';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { AddHealthChecks, EditHealthChecks } from '@console/app/src/actions/modify-health-checks';
import { EditResourceLimits } from '@console/app/src/actions/edit-resource-limits';
import {
  AddHorizontalPodAutoScaler,
  DeleteHorizontalPodAutoScaler,
  EditHorizontalPodAutoScaler,
  hideActionForHPAs,
} from '@console/app/src/actions/modify-hpa';
import {
  k8sCreate,
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
  referenceFor,
} from '../module/k8s';
import { errorModal } from './modals';
import { DeploymentConfigModel } from '../models';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DetailsPage, ListPage, Table, RowFunctionArgs } from './factory';
import {
  AsyncComponent,
  ContainerTable,
  DetailsItem,
  Kebab,
  KebabAction,
  ResourceSummary,
  SectionHeading,
  WorkloadPausedAlert,
  getExtensionsKebabActionsForKind,
  navFactory,
  togglePaused,
  RuntimeClass,
} from './utils';
import { ReplicationControllersPage } from './replication-controller';
import { WorkloadTableRow, WorkloadTableHeader } from './workload-table';

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

const RolloutAction: KebabAction = (kind: K8sKind, obj: K8sResourceKind) => ({
  // t('public~Start rollout')
  labelKey: 'public~Start rollout',
  callback: () =>
    rollout(obj).catch((err) => {
      const error = err.message;
      errorModal({ error });
    }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    subresource: 'instantiate',
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'create',
  },
});

const PauseAction: KebabAction = (kind: K8sKind, obj: K8sResourceKind) => ({
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

const { ModifyCount, AddStorage, common } = Kebab.factory;

export const menuActions: KebabAction[] = [
  RolloutAction,
  PauseAction,
  hideActionForHPAs(ModifyCount),
  AddHealthChecks,
  AddHorizontalPodAutoScaler,
  EditHorizontalPodAutoScaler,
  AddStorage,
  DeleteHorizontalPodAutoScaler,
  EditResourceLimits,
  ...getExtensionsKebabActionsForKind(DeploymentConfigModel),
  EditHealthChecks,
  ...common,
];

const getDeploymentConfigStatus = (dc: K8sResourceKind): string => {
  const conditions = _.get(dc, 'status.conditions');
  const progressingFailure = _.some(conditions, {
    type: 'Progressing',
    reason: 'ProgressDeadlineExceeded',
    status: 'False',
  });
  const replicaFailure = _.some(conditions, { type: 'ReplicaFailure', status: 'True' });
  if (progressingFailure || replicaFailure) {
    return 'Failed';
  }

  if (
    dc.status.availableReplicas === dc.status.updatedReplicas &&
    dc.spec.replicas === dc.status.availableReplicas
  ) {
    return 'Up to date';
  }
  return 'Updating';
};

export const DeploymentConfigDetailsList = ({ dc }) => {
  const { t } = useTranslation();
  const timeout = _.get(dc, 'spec.strategy.rollingParams.timeoutSeconds');
  const updatePeriod = _.get(dc, 'spec.strategy.rollingParams.updatePeriodSeconds');
  const interval = _.get(dc, 'spec.strategy.rollingParams.intervalSeconds');
  const triggers = _.map(dc.spec.triggers, 'type').join(', ');
  return (
    <dl className="co-m-pane__details">
      <DetailsItem label={t('public~Latest version')} obj={dc} path="status.latestVersion" />
      <DetailsItem label={t('public~Message')} obj={dc} path="status.details.message" hideEmpty />
      <DetailsItem label={t('public~Update strategy')} obj={dc} path="spec.strategy.type" />
      {dc.spec.strategy.type === 'Rolling' && (
        <>
          <DetailsItem
            label={t('public~Timeout')}
            obj={dc}
            path="spec.strategy.rollingParams.timeoutSeconds"
            hideEmpty
          >
            {t('public~{{count}} second', { count: timeout })}
          </DetailsItem>
          <DetailsItem
            label={t('public~Update period')}
            obj={dc}
            path="spec.strategy.rollingParams.updatePeriodSeconds"
            hideEmpty
          >
            {t('public~{{count}} second', { count: updatePeriod })}
          </DetailsItem>
          <DetailsItem
            label={t('public~Interval')}
            obj={dc}
            path="spec.strategy.rollingParams.intervalSeconds"
            hideEmpty
          >
            {t('public~{{count}} second', { count: interval })}
          </DetailsItem>
          <DetailsItem
            label={t('public~Max unavailable')}
            obj={dc}
            path="spec.strategy.rollingParams.maxUnavailable"
          >
            {t('public~{{maxUnavailable}} of {{count}} pod', {
              maxUnavailable: dc.spec.strategy.rollingParams.maxUnavailable ?? 1,
              count: dc.spec.replicas,
            })}
          </DetailsItem>
          <DetailsItem
            label={t('public~Max surge')}
            obj={dc}
            path="spec.strategy.rollingParams.maxSurge"
          >
            {t('public~{{maxSurge}} greater than {{count}} pod', {
              maxSurge: dc.spec.strategy.rollingParams.maxSurge ?? 1,
              count: dc.spec.replicas,
            })}
          </DetailsItem>
        </>
      )}
      <DetailsItem label={t('public~Min ready seconds')} obj={dc} path="spec.minReadySeconds">
        {dc.spec.minReadySeconds
          ? t('public~{{count}} second', { count: dc.spec.minReadySeconds })
          : t('public~Not configured')}
      </DetailsItem>
      <DetailsItem label={t('public~Triggers')} obj={dc} path="spec.triggers" hideEmpty>
        {triggers}
      </DetailsItem>
      <RuntimeClass obj={dc} />
    </dl>
  );
};

export const DeploymentConfigsDetails: React.FC<{ obj: K8sResourceKind }> = ({ obj: dc }) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~DeploymentConfig details')} />
        {dc.spec.paused && <WorkloadPausedAlert obj={dc} model={DeploymentConfigModel} />}
        <PodRingSet key={dc.metadata.uid} obj={dc} path="/spec/replicas" />
        <div className="co-m-pane__body-group">
          <div className="row">
            <div className="col-sm-6">
              <ResourceSummary resource={dc} showPodSelector showNodeSelector showTolerations>
                <dt>{t('public~Status')}</dt>
                <dd>
                  <Status status={getDeploymentConfigStatus(dc)} />
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
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={dc.spec.template.spec.containers} />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={dc} heading={t('public~Volumes')} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={dc.status.conditions} />
      </div>
    </>
  );
};

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

const ReplicationControllersTab: React.FC<ReplicationControllersTabProps> = ({ obj }) => {
  const {
    metadata: { namespace, name },
  } = obj;

  // Hide the create button to avoid confusion when showing replication controllers for an object.
  return (
    <ReplicationControllersPage
      showTitle={false}
      namespace={namespace}
      selector={{
        'openshift.io/deployment-config.name': name,
      }}
      canCreate={false}
    />
  );
};
// t('public~ReplicationControllers')
const pages = [
  navFactory.details(DeploymentConfigsDetails),
  navFactory.editYaml(),
  {
    href: 'replicationcontrollers',
    nameKey: 'public~ReplicationControllers',
    component: ReplicationControllersTab,
  },
  navFactory.pods(),
  navFactory.envEditor(environmentComponent),
  navFactory.events(ResourceEventStream),
];

export const DeploymentConfigsDetailsPage: React.FC<DeploymentConfigsDetailsPageProps> = (
  props,
) => {
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
  return (
    <DetailsPage
      {...props}
      kind={DeploymentConfigsReference}
      customActionMenu={customActionMenu}
      pages={pages}
    />
  );
};
DeploymentConfigsDetailsPage.displayName = 'DeploymentConfigsDetailsPage';

const kind = 'DeploymentConfig';

const DeploymentConfigTableRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj }) => {
  const resourceKind = referenceFor(obj);
  const context = { [resourceKind]: obj };
  const customActionMenu = <LazyActionMenu context={context} />;
  return <WorkloadTableRow obj={obj} customActionMenu={customActionMenu} kind={kind} />;
};

const DeploymentConfigTableHeader = () => {
  return WorkloadTableHeader();
};
DeploymentConfigTableHeader.displayName = 'DeploymentConfigTableHeader';

export const DeploymentConfigsList: React.FC = (props) => {
  const { t } = useTranslation();
  return (
    <Table
      {...props}
      aria-label={t('public~DeploymentConfigs')}
      Header={DeploymentConfigTableHeader}
      Row={DeploymentConfigTableRow}
      virtualize
    />
  );
};
DeploymentConfigsList.displayName = 'DeploymentConfigsList';

export const DeploymentConfigsPage: React.FC<DeploymentConfigsPageProps> = (props) => {
  return (
    <ListPage
      kind={DeploymentConfigsReference}
      ListComponent={DeploymentConfigsList}
      canCreate={true}
      {...props}
    />
  );
};
DeploymentConfigsPage.displayName = 'DeploymentConfigsListPage';

type ReplicationControllersTabProps = {
  obj: K8sResourceKind;
};

type DeploymentConfigsPageProps = {
  filterLabel: string;
  namespace: string;
};

type DeploymentConfigsDetailsPageProps = {
  match: any;
};
