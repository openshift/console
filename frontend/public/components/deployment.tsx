import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionServiceProvider,
  LazyActionMenu,
  ActionMenu,
  ActionMenuVariant,
  Status,
  usePrometheusGate,
} from '@console/shared';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';

import { DeploymentModel } from '../models';
import {
  DeploymentKind,
  K8sResourceKindReference,
  referenceFor,
  referenceForModel,
} from '../module/k8s';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DetailsPage, ListPage, Table, RowFunctionArgs } from './factory';
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
import { WorkloadTableRow, WorkloadTableHeader } from './workload-table';
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

const deploymentsReference: K8sResourceKindReference = 'Deployment';

export const DeploymentDetailsList: React.FC<DeploymentDetailsListProps> = ({ deployment }) => {
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

const DeploymentDetails: React.FC<DeploymentDetailsProps> = ({ obj: deployment }) => {
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

export const DeploymentsDetailsPage: React.FC = (props) => {
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
      kind={deploymentsReference}
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

type DeploymentDetailsListProps = {
  deployment: DeploymentKind;
};

type DeploymentDetailsProps = {
  obj: DeploymentKind;
};

const kind = 'Deployment';

const DeploymentTableRow: React.FC<RowFunctionArgs<DeploymentKind>> = ({ obj, ...props }) => {
  const resourceKind = referenceFor(obj);
  const context = { [resourceKind]: obj };
  const customActionMenu = <LazyActionMenu context={context} />;
  return <WorkloadTableRow obj={obj} customActionMenu={customActionMenu} kind={kind} {...props} />;
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
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/deployments/~new/form`,
  };
  return (
    <ListPage
      kind={deploymentsReference}
      canCreate={true}
      createProps={createProps}
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
