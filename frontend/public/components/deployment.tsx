import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  Status,
  usePrometheusGate,
} from '@console/shared';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';

import { DeploymentModel } from '../models';
import { DeploymentKind, referenceForModel } from '../module/k8s';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DetailsPage, ListPage } from './factory';
import {
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { LoadingBox } from './utils/status-box';
import {
  AsyncComponent,
  DetailsItem,
  ContainerTable,
  navFactory,
  ResourceSummary,
  SectionHeading,
  WorkloadPausedAlert,
  RuntimeClass,
} from './utils';
import { ReplicaSetsPage } from './replicaset';
import { WorkloadTableHeader, useWorkloadColumns, getWorkloadDataViewRows } from './workload-table';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import { VerticalPodAutoscalerRecommendations } from '@console/app/src/components/vpa/VerticalPodAutoscalerRecommendations';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';

const kind = referenceForModel(DeploymentModel);

export const DeploymentDetailsList: React.FCC<DeploymentDetailsListProps> = ({ deployment }) => {
  const { t } = useTranslation();
  return (
    <DescriptionList>
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
      <PodDisruptionBudgetField obj={deployment} />
      <VerticalPodAutoscalerRecommendations obj={deployment} />
    </DescriptionList>
  );
};
DeploymentDetailsList.displayName = 'DeploymentDetailsList';

const DeploymentDetails: React.FCC<DeploymentDetailsProps> = ({ obj: deployment }) => {
  const { t } = useTranslation();

  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~Deployment details')} />
        {deployment.spec.paused && <WorkloadPausedAlert obj={deployment} model={DeploymentModel} />}
        <PodRingSet key={deployment.metadata.uid} obj={deployment} path="/spec/replicas" />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={deployment} showPodSelector showNodeSelector showTolerations>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {deployment.status.availableReplicas === deployment.status.updatedReplicas &&
                  deployment.spec.replicas === deployment.status.availableReplicas ? (
                    <Status status="Up to date" />
                  ) : (
                    <Status status="Updating" />
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
          </GridItem>
          <GridItem sm={6}>
            <DeploymentDetailsList deployment={deployment} />
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={deployment.spec.template.spec.containers} />
      </PaneBody>
      <PaneBody>
        <VolumesTable resource={deployment} heading={t('public~Volumes')} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={deployment.status.conditions} />
      </PaneBody>
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

const ReplicaSetsTab: React.FCC<ReplicaSetsTabProps> = ({ obj }) => {
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

export const DeploymentsDetailsPage: React.FCC = (props) => {
  const prometheusIsAvailable = usePrometheusGate();
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
      kind={kind}
      customActionMenu={customActionMenu}
      pages={[
        navFactory.details(DeploymentDetails),
        ...(prometheusIsAvailable ? [navFactory.metrics()] : []),
        navFactory.editYaml(),
        {
          href: 'replicasets',
          nameKey: 'public~ReplicaSets',
          component: ReplicaSetsTab,
        },
        navFactory.pods(),
        navFactory.envEditor(environmentComponent),
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
};
DeploymentsDetailsPage.displayName = 'DeploymentsDetailsPage';

const DeploymentTableHeader = () => {
  return WorkloadTableHeader();
};
DeploymentTableHeader.displayName = 'DeploymentTableHeader';

const getDataViewRows: GetDataViewRows<DeploymentKind, undefined> = (data, columns) => {
  return getWorkloadDataViewRows(data, columns, DeploymentModel);
};

export const DeploymentsList: React.FCC<DeploymentsListProps> = ({ data, loaded, ...props }) => {
  const columns = useWorkloadColumns<DeploymentKind>();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        label={DeploymentModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
      />
    </React.Suspense>
  );
};
DeploymentsList.displayName = 'DeploymentsList';

export const DeploymentsPage: React.FCC<DeploymentsPageProps> = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/deployments/~new/form`,
  };
  return (
    <ListPage
      {...props}
      kind={kind}
      canCreate={true}
      createProps={createProps}
      ListComponent={DeploymentsList}
      omitFilterToolbar={true}
      hideColumnManagement={true}
    />
  );
};
DeploymentsPage.displayName = 'DeploymentsPage';

type DeploymentDetailsListProps = {
  deployment: DeploymentKind;
};

type DeploymentDetailsProps = {
  obj: DeploymentKind;
};

type DeploymentsListProps = {
  data: any[];
  loaded: boolean;
  [key: string]: any;
};

type ReplicaSetsTabProps = {
  obj: DeploymentKind;
};

type DeploymentsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};
