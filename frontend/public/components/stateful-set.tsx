import * as React from 'react';
import { useTranslation } from 'react-i18next';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import {
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  usePrometheusGate,
} from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DeploymentKind, K8sResourceKind, referenceForModel } from '../module/k8s';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage } from './factory';

import {
  AsyncComponent,
  ContainerTable,
  ResourceSummary,
  SectionHeading,
  navFactory,
  PodsComponent,
  RuntimeClass,
  LoadingBox,
} from './utils';
import { VolumesTable } from './volumes-table';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import {
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { StatefulSetModel } from '../models';
import { useWorkloadColumns, getWorkloadDataViewRows } from './workload-table';

const StatefulSetDetails: React.FC<StatefulSetDetailsProps> = ({ obj: ss }) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~StatefulSet details')} />
        <PodRingSet key={ss.metadata.uid} obj={ss} path="/spec/replicas" />
        <Grid hasGutter>
          <GridItem md={6}>
            <ResourceSummary resource={ss} showPodSelector showNodeSelector showTolerations>
              <RuntimeClass obj={ss} />
            </ResourceSummary>
          </GridItem>
          <GridItem md={6}>
            <DescriptionList>
              <PodDisruptionBudgetField obj={ss} />
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={ss.spec.template.spec.containers} />
      </PaneBody>
      <PaneBody>
        <VolumesTable resource={ss} heading={t('public~Volumes')} />
      </PaneBody>
    </>
  );
};

const EnvironmentPage: React.FC<EnvironmentPageProps> = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'template', 'spec', 'containers'];
const EnvironmentTab: React.FC<EnvironmentTabProps> = (props) => (
  <EnvironmentPage
    obj={props.obj}
    rawEnvData={props.obj.spec.template.spec}
    envPath={envPath}
    readOnly={false}
  />
);

const StatefulSetsList: React.FCC<StatefulSetsListProps> = ({ data, loaded, ...props }) => {
  const columns = useWorkloadColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<K8sResourceKind>
        {...props}
        label={StatefulSetModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={(dvData, dvColumns) =>
          getWorkloadDataViewRows(dvData, dvColumns, StatefulSetModel)
        }
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const StatefulSetsPage: React.FCC<StatefulSetsPageProps> = (props) => {
  return (
    <ListPage
      {...props}
      kind={referenceForModel(StatefulSetModel)}
      ListComponent={StatefulSetsList}
      canCreate={true}
      omitFilterToolbar={true}
    />
  );
};

const StatefulSetPods: React.FC<StatefulSetPodsProps> = (props) => (
  <PodsComponent {...props} showNodes />
);

export const StatefulSetsDetailsPage: React.FC = (props) => {
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
      kind={referenceForModel(StatefulSetModel)}
      customActionMenu={customActionMenu}
      pages={[
        navFactory.details(StatefulSetDetails),
        ...(prometheusIsAvailable ? [navFactory.metrics()] : []),
        navFactory.editYaml(),
        navFactory.pods(StatefulSetPods),
        navFactory.envEditor(EnvironmentTab),
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
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

type StatefulSetDetailsProps = {
  obj: DeploymentKind;
};

type StatefulSetsListProps = {
  data: any[];
  loaded: boolean;
};

type StatefulSetsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type StatefulSetPodsProps = {
  obj: K8sResourceKind;
};
