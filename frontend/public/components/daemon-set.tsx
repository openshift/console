import * as React from 'react';
import { Link } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import {
  usePodsWatcher,
  PodRing,
  LazyActionMenu,
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  usePrometheusGate,
  DASH,
} from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  K8sResourceKind,
  referenceFor,
  referenceForModel,
  DaemonSetKind,
  TableColumn,
} from '../module/k8s';
import { DetailsPage, ListPage } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  ContainerTable,
  detailsPage,
  LabelList,
  navFactory,
  PodsComponent,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
  LoadingInline,
  LoadingBox,
} from './utils';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ResourceDataView,
} from '@console/app/src/components/data-view/ResourceDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DaemonSetModel } from '../models';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';

const kind = referenceForModel(DaemonSetModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'status' },
  { id: 'labels' },
  { id: 'podSelector' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<DaemonSetKind, undefined> = (data, columns) => {
  return data.map(({ obj: daemonset }) => {
    const { name, namespace } = daemonset.metadata;
    const resourceKind = referenceFor(daemonset);
    const context = { [resourceKind]: daemonset };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(DaemonSetModel)}
            name={name}
            namespace={namespace}
          />
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: (
          <Link
            to={`/k8s/ns/${daemonset.metadata.namespace}/daemonsets/${daemonset.metadata.name}/pods`}
            title="pods"
          >
            {`${daemonset.status.currentNumberScheduled} of ${daemonset.status.desiredNumberScheduled} pods`}
          </Link>
        ),
      },
      [tableColumnInfo[3].id]: {
        cell: <LabelList kind={kind} labels={daemonset.metadata.labels} />,
      },
      [tableColumnInfo[4].id]: {
        cell: (
          <Selector selector={daemonset.spec.selector} namespace={daemonset.metadata.namespace} />
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: <LazyActionMenu context={context} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

export const DaemonSetDetailsList: React.FC<DaemonSetDetailsListProps> = ({ ds }) => {
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

const DaemonSetDetails: React.FC<DaemonSetDetailsProps> = ({ obj: daemonset }) => {
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

const useDaemonSetsColumns = () => {
  const { t } = useTranslation();
  const columns: TableColumn<DaemonSetKind>[] = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: tableColumnInfo[2].id,
        sort: 'status.currentNumberScheduled',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Labels'),
        id: tableColumnInfo[3].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Pod selector'),
        id: tableColumnInfo[4].id,
        sort: 'spec.selector',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

type DaemonSetsListProps = {
  data: DaemonSetKind[];
  loaded: boolean;
  [key: string]: any;
};

export const DaemonSetsList: React.FC<DaemonSetsListProps> = ({ data, loaded, ...props }) => {
  const columns = useDaemonSetsColumns();

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

export const DaemonSetsPage: React.FC<DaemonSetsPageProps> = (props) => (
  <ListPage
    canCreate={true}
    ListComponent={DaemonSetsList}
    kind={kind}
    omitFilterToolbar={true}
    {...props}
  />
);

const DaemonSetPods: React.FC<DaemonSetPodsProps> = (props) => (
  <PodsComponent {...props} showNodes />
);

export const DaemonSetsDetailsPage: React.FC = (props) => {
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
