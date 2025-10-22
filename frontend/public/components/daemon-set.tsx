import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  usePodsWatcher,
  PodRing,
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  usePrometheusGate,
} from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { K8sResourceKind, referenceForModel, DaemonSetKind } from '../module/k8s';
import { DetailsPage, ListPage } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  ContainerTable,
  detailsPage,
  navFactory,
  PodsComponent,
  ResourceSummary,
  SectionHeading,
  LoadingInline,
  LoadingBox,
} from './utils';
import {
  initialFiltersDefault,
  ResourceDataView,
} from '@console/app/src/components/data-view/ResourceDataView';
import { useWorkloadColumns, getWorkloadDataViewRows } from './workload-table';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DaemonSetModel } from '../models';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';

const kind = referenceForModel(DaemonSetModel);

const getDataViewRows: GetDataViewRows<DaemonSetKind, undefined> = (data, columns) => {
  return getWorkloadDataViewRows(data, columns, DaemonSetModel);
};

export const DaemonSetDetailsList: React.FCC<DaemonSetDetailsListProps> = ({ ds }) => {
  const { t } = useTranslation();
  return (
    <DescriptionList>
      <DetailsItem
        label={t('public~Current count')}
        obj={ds}
        path="status.currentNumberScheduled"
      />
      <DetailsItem
        label={t('public~Desired count')}
        obj={ds}
        path="status.desiredNumberScheduled"
      />
      <PodDisruptionBudgetField obj={ds} />
    </DescriptionList>
  );
};

const DaemonSetDetails: React.FCC<DaemonSetDetailsProps> = ({ obj: daemonset }) => {
  const { t } = useTranslation();
  const { podData, loaded } = usePodsWatcher(daemonset);
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~DaemonSet details')} />
        {loaded ? (
          <PodRing
            key={daemonset.metadata.uid}
            pods={podData?.pods || []}
            obj={daemonset}
            resourceKind={DaemonSetModel}
            enableScaling={false}
          />
        ) : (
          <LoadingInline />
        )}
        <Grid hasGutter>
          <GridItem lg={6}>
            <ResourceSummary
              resource={daemonset}
              showPodSelector
              showNodeSelector
              showTolerations
            />
          </GridItem>
          <GridItem lg={6}>
            <DaemonSetDetailsList ds={daemonset} />
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={daemonset.spec.template.spec.containers} />
      </PaneBody>
      <PaneBody>
        <VolumesTable resource={daemonset} heading={t('public~Volumes')} />
      </PaneBody>
    </>
  );
};

const EnvironmentPage: React.FCC<EnvironmentPageProps> = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'template', 'spec', 'containers'];
const EnvironmentTab: React.FCC<EnvironmentTabProps> = (props) => (
  <EnvironmentPage
    obj={props.obj}
    rawEnvData={props.obj.spec.template.spec}
    envPath={envPath}
    readOnly={false}
  />
);

export const DaemonSetsList: React.FCC<DaemonSetsListProps> = ({ data, loaded, ...props }) => {
  const columns = useWorkloadColumns<DaemonSetKind>();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ResourceDataView<DaemonSetKind>
        {...props}
        label={DaemonSetModel.labelPlural}
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

export const DaemonSetsPage: React.FCC<DaemonSetsPageProps> = (props) => (
  <ListPage
    canCreate={true}
    ListComponent={DaemonSetsList}
    kind={kind}
    omitFilterToolbar={true}
    {...props}
  />
);

const DaemonSetPods: React.FCC<DaemonSetPodsProps> = (props) => (
  <PodsComponent {...props} showNodes />
);

export const DaemonSetsDetailsPage: React.FCC = (props) => {
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
  return (
    <DetailsPage
      {...props}
      kind={kind}
      customActionMenu={customActionMenu}
      pages={[
        navFactory.details(detailsPage(DaemonSetDetails)),
        ...(prometheusIsAvailable ? [navFactory.metrics()] : []),
        navFactory.editYaml(),
        navFactory.pods(DaemonSetPods),
        navFactory.envEditor(EnvironmentTab),
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
};

type DaemonSetsListProps = {
  data: DaemonSetKind[];
  loaded: boolean;
  [key: string]: any;
};

type DaemonSetDetailsListProps = {
  ds: DaemonSetKind;
};

type EnvironmentPageProps = {
  obj: K8sResourceKind;
  rawEnvData: any;
  envPath: string[];
  readOnly: boolean;
};

type EnvironmentTabProps = {
  obj: K8sResourceKind;
};

type DaemonSetDetailsProps = {
  obj: DaemonSetKind;
};

type DaemonSetsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type DaemonSetPodsProps = {
  obj: K8sResourceKind;
};
