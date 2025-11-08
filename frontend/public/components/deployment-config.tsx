import * as React from 'react';
import * as _ from 'lodash-es';
import Status from '@console/dynamic-plugin-sdk/src/app/components/status/Status';
import {
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
} from '@console/shared/src/components/actions';
import { useTranslation } from 'react-i18next';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceForModel,
  DeploymentConfigKind,
} from '../module/k8s';
import { DeploymentConfigModel } from '../models';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DetailsPage, ListPage } from './factory';
import {
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { LoadingBox } from './utils/status-box';

import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import {
  AsyncComponent,
  ContainerTable,
  DetailsItem,
  ResourceSummary,
  SectionHeading,
  WorkloadPausedAlert,
  navFactory,
  RuntimeClass,
  getDocumentationURL,
  documentationURLs,
  isManaged,
} from './utils';
import { ReplicationControllersPage } from './replication-controller';
import { WorkloadTableHeader, useWorkloadColumns, getWorkloadDataViewRows } from './workload-table';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import {
  Alert,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';

const DeploymentConfigsReference: K8sResourceKindReference = 'DeploymentConfig';

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
    <DescriptionList>
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
      <PodDisruptionBudgetField obj={dc} />
    </DescriptionList>
  );
};

export const DeploymentConfigDeprecationAlert: React.FCC = () => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      variant="info"
      title={t('public~DeploymentConfig is being deprecated with OpenShift 4.14')}
    >
      <p>
        {t(
          'public~Feature development of DeploymentConfigs will be deprecated in OpenShift Container Platform 4.14.',
        )}
      </p>
      <p>
        {t(
          'public~DeploymentConfigs will continue to be supported for security and critical fixes, but you should migrate to Deployments wherever it is possible.',
        )}
      </p>
      {!isManaged() && (
        <ExternalLink
          href={getDocumentationURL(documentationURLs.deprecatedDeploymentConfig)}
          text={t('public~Learn more about Deployments')}
          className="pf-v6-u-mt-md"
        />
      )}
    </Alert>
  );
};

export const DeploymentConfigsDetails: React.FCC<{ obj: K8sResourceKind }> = ({ obj: dc }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~DeploymentConfig details')} />
        {dc.spec.paused && <WorkloadPausedAlert obj={dc} model={DeploymentConfigModel} />}
        <PodRingSet key={dc.metadata.uid} obj={dc} path="/spec/replicas" />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={dc} showPodSelector showNodeSelector showTolerations>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <Status status={getDeploymentConfigStatus(dc)} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            </ResourceSummary>
          </GridItem>
          <GridItem sm={6}>
            <DeploymentConfigDetailsList dc={dc} />
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={dc.spec.template.spec.containers} />
      </PaneBody>
      <PaneBody>
        <VolumesTable resource={dc} heading={t('public~Volumes')} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={dc.status.conditions} />
      </PaneBody>
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

const ReplicationControllersTab: React.FCC<ReplicationControllersTabProps> = ({ obj }) => {
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

const DetailsActionMenu: React.FCC<DetailsActionMenuProps> = ({ kindObj, obj }) => {
  const resourceKind = referenceForModel(kindObj);
  const context = { [resourceKind]: obj };

  return (
    <ActionServiceProvider context={context}>
      {({ actions, options, loaded }) => {
        return (
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        );
      }}
    </ActionServiceProvider>
  );
};

export const DeploymentConfigsDetailsPage: React.FCC = (props) => {
  const customActionMenu = (kindObj, obj) => {
    return <DetailsActionMenu kindObj={kindObj} obj={obj} />;
  };
  return (
    <DetailsPage
      {...props}
      kind={DeploymentConfigsReference}
      customActionMenu={customActionMenu}
      pages={pages}
      helpAlert={<DeploymentConfigDeprecationAlert />}
    />
  );
};
DeploymentConfigsDetailsPage.displayName = 'DeploymentConfigsDetailsPage';

const DeploymentConfigTableHeader = () => {
  return WorkloadTableHeader();
};
DeploymentConfigTableHeader.displayName = 'DeploymentConfigTableHeader';

const getDataViewRows: GetDataViewRows<DeploymentConfigKind, undefined> = (data, columns) => {
  return getWorkloadDataViewRows(data, columns, DeploymentConfigModel);
};

export const DeploymentConfigsList: React.FCC<DeploymentConfigsListProps> = ({
  data,
  loaded,
  ...props
}) => {
  const columns = useWorkloadColumns<DeploymentConfigKind>();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        label={DeploymentConfigModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};
DeploymentConfigsList.displayName = 'DeploymentConfigsList';

export const DeploymentConfigsPage: React.FCC<DeploymentConfigsPageProps> = (props) => {
  const createProps = {
    to: `/k8s/ns/${props.namespace || 'default'}/deploymentconfigs/~new/form`,
  };
  return (
    <ListPage
      kind={DeploymentConfigsReference}
      ListComponent={DeploymentConfigsList}
      createProps={createProps}
      canCreate={true}
      helpAlert={<DeploymentConfigDeprecationAlert />}
      omitFilterToolbar={true}
      {...props}
    />
  );
};
DeploymentConfigsPage.displayName = 'DeploymentConfigsListPage';

type DeploymentConfigsListProps = {
  data: any[];
  loaded: boolean;
  [key: string]: any;
};

type DetailsActionMenuProps = {
  kindObj: K8sKind;
  obj: K8sResourceKind;
};

type ReplicationControllersTabProps = {
  obj: K8sResourceKind;
};

type DeploymentConfigsPageProps = {
  filterLabel: string;
  namespace: string;
};
