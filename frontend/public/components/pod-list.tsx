import {
  actionsCellProps,
  cellIsStickyProps,
  ConsoleDataView,
  getNameCellProps,
  initialFiltersDefault,
} from '@console/app/src/components/data-view/ConsoleDataView';
import {
  ConsoleDataViewColumn,
  ConsoleDataViewRow,
  ResourceFilters,
} from '@console/app/src/components/data-view/types';
import { ListPageBody } from '@console/dynamic-plugin-sdk';
import {
  ColumnLayout,
  RowProps,
  TableColumn,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { Status } from '@console/shared/src/components/status/Status';
import {
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants/common';
import { DASH } from '@console/shared/src/constants/ui';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import type { TableColumnsType } from '@console/shared/src/types/tableColumn';
import { Button, Content, ContentVariants, Divider, Popover } from '@patternfly/react-core';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { DataViewFilterOption } from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import * as _ from 'lodash-es';
import { useEffect, useMemo, FC, ReactNode, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom-v5-compat';
import * as UIActions from '../actions/ui';
import { coFetchJSON } from '../co-fetch';
import { PodModel } from '../models';
import { ContainerSpec, PodKind, referenceFor, referenceForModel, Selector } from '../module/k8s';
import {
  isContainerCrashLoopBackOff,
  isWindowsPod,
  podPhase,
  podPhaseFilterReducer,
  podReadiness,
  podRestarts,
} from '../module/k8s/pods';
import type { RootState } from '../redux';
import ListPageCreate from './factory/ListPage/ListPageCreate';
import ListPageHeader from './factory/ListPage/ListPageHeader';
import { sortResourceByValue } from './factory/Table/sort';
import { PROMETHEUS_BASE_PATH, PROMETHEUS_TENANCY_BASE_PATH } from './graphs/consts';
import { PodTraffic } from './pod-traffic';
import { useK8sWatchResource } from './utils/k8s-watch-hook';
import { Kebab } from './utils/kebab';
import { LabelList } from './utils/label-list';
import { OwnerReferences } from './utils/owner-references';
import { ResourceLink, resourcePath } from './utils/resource-link';
import { LoadingBox } from './utils/status-box';
import { formatBytesAsMiB, formatCores } from './utils/units';

// Only request metrics if the device's screen width is larger than the
// breakpoint where metrics are visible.
const showMetrics =
  PROMETHEUS_BASE_PATH && PROMETHEUS_TENANCY_BASE_PATH && window.screen.width >= 1200;

const fetchPodMetrics = (namespace: string): Promise<UIActions.PodMetrics> => {
  const metrics = [
    {
      key: 'memory',
      query: namespace
        ? `sum(container_memory_working_set_bytes{namespace='${namespace}',container=''}) BY (pod, namespace)`
        : "sum(container_memory_working_set_bytes{container=''}) BY (pod, namespace)",
    },
    {
      key: 'cpu',
      query: namespace
        ? `pod:container_cpu_usage:sum{namespace='${namespace}'}`
        : 'pod:container_cpu_usage:sum',
    },
  ];
  const promises = metrics.map(
    ({ key, query }): Promise<UIActions.PodMetrics> => {
      const url = namespace
        ? `${PROMETHEUS_TENANCY_BASE_PATH}/api/v1/query?namespace=${namespace}&query=${query}`
        : `${PROMETHEUS_BASE_PATH}/api/v1/query?query=${query}`;
      return coFetchJSON(url).then(({ data: { result } }) => {
        return result.reduce((acc, data) => {
          const value = Number(data.value[1]);
          return _.set(acc, [key, data.metric.namespace, data.metric.pod], value);
        }, {});
      });
    },
  );
  return Promise.all(promises).then((data: unknown[]) => _.assign({}, ...data));
};

export const menuActions = [...(Kebab.factory.common || [])];

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'status' },
  { id: 'ready' },
  { id: 'restarts' },
  { id: 'owner' },
  { id: 'memory' },
  { id: 'cpu' },
  { id: 'created' },
  { id: 'node' },
  { id: 'labels' },
  { id: 'ipaddress' },
  { id: 'traffic' },
  { id: '' },
];

const usePodsColumns = (showNodes: boolean): TableColumn<PodKind>[] => {
  const { t } = useTranslation();
  const columns = useMemo(() => {
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
        sort: (data, direction) => data.sort(sortResourceByValue(direction, podPhase)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Ready'),
        id: tableColumnInfo[3].id,
        sort: (data, direction) =>
          data.sort(sortResourceByValue(direction, (obj) => podReadiness(obj).readyCount)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Restarts'),
        id: tableColumnInfo[4].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, podRestarts)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: showNodes ? t('public~Node') : t('public~Owner'),
        id: tableColumnInfo[5].id,
        sort: showNodes ? 'spec.nodeName' : 'metadata.ownerReferences[0].name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Memory'),
        id: tableColumnInfo[6].id,
        sort: (data, direction) =>
          data.sort(sortResourceByValue(direction, (obj) => UIActions.getPodMetric(obj, 'memory'))),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~CPU'),
        id: tableColumnInfo[7].id,
        sort: (data, direction) =>
          data.sort(sortResourceByValue(direction, (obj) => UIActions.getPodMetric(obj, 'cpu'))),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Created'),
        id: tableColumnInfo[8].id,
        sort: 'metadata.creationTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Node'),
        id: tableColumnInfo[9].id,
        sort: 'spec.nodeName',
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('public~Labels'),
        id: tableColumnInfo[10].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('public~IP address'),
        id: tableColumnInfo[11].id,
        sort: 'status.podIP',
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: t('public~Receiving Traffic'),
        id: tableColumnInfo[12].id,
        props: {
          modifier: 'nowrap',
        },
        additional: true,
      },
      {
        title: '',
        id: tableColumnInfo[13].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t, showNodes]);
  return columns;
};

const Cores: FC<CoresProps> = ({ cores }) => {
  const { t } = useTranslation();
  return cores ? (
    <>{t('public~{{numCores}} cores', { numCores: formatCores(cores) })}</>
  ) : (
    <>{DASH}</>
  );
};

const PodStatusPopover: FC<PodStatusPopoverProps> = ({
  bodyContent,
  headerContent,
  footerContent,
  status,
}) => {
  return (
    <Popover headerContent={headerContent} bodyContent={bodyContent} footerContent={footerContent}>
      <Button variant="link" isInline data-test="popover-status-button">
        <Status status={status} />
      </Button>
    </Popover>
  );
};

export const PodStatus: FC<PodStatusProps> = ({ pod }) => {
  const status = podPhase(pod);
  const unschedulableCondition = pod.status?.conditions?.find(
    (condition) => condition.reason === 'Unschedulable' && condition.status === 'False',
  );
  const containerStatusStateWaiting = pod.status?.containerStatuses?.find(
    (cs) => cs.state?.waiting,
  );
  const { t } = useTranslation();

  if (status === 'Pending' && unschedulableCondition) {
    return (
      <PodStatusPopover
        bodyContent={unschedulableCondition.message || ''}
        headerContent={t('public~Pod unschedulable')}
        status={status}
      />
    );
  }
  if (
    (status === 'CrashLoopBackOff' || status === 'ErrImagePull' || status === 'ImagePullBackOff') &&
    containerStatusStateWaiting
  ) {
    let footerLinks: ReactNode;
    let headerTitle = '';
    if (status === 'CrashLoopBackOff') {
      headerTitle = t('public~Pod crash loop back-off');
      const containers: ContainerSpec[] = pod.spec.containers;
      footerLinks = (
        <Content>
          <Content component={ContentVariants.p}>
            {t(
              'public~CrashLoopBackOff indicates that the application within the container is failing to start properly.',
            )}
          </Content>
          <Content component={ContentVariants.p}>
            {t('public~To troubleshoot, view logs and events, then debug in terminal.')}
          </Content>
          <Content component={ContentVariants.p}>
            <Link to={`${resourcePath('Pod', pod.metadata.name, pod.metadata.namespace)}/logs`}>
              {t('public~View logs')}
            </Link>
            &emsp;
            <Link to={`${resourcePath('Pod', pod.metadata.name, pod.metadata.namespace)}/events`}>
              {t('public~View events')}
            </Link>
          </Content>
          <Divider />
          {containers.map((container) => {
            if (isContainerCrashLoopBackOff(pod, container.name) && !isWindowsPod(pod)) {
              return (
                <div key={container.name}>
                  <Link
                    to={`${resourcePath(
                      'Pod',
                      pod.metadata.name,
                      pod.metadata.namespace,
                    )}/containers/${container.name}/debug`}
                    data-test={`popup-debug-container-link-${container.name}`}
                  >
                    {t('public~Debug container {{name}}', { name: container.name })}
                  </Link>
                </div>
              );
            }
          })}
        </Content>
      );
    }

    return (
      <PodStatusPopover
        headerContent={headerTitle}
        bodyContent={containerStatusStateWaiting.state?.waiting?.message || ''}
        footerContent={footerLinks}
        status={status}
      />
    );
  }

  return <Status status={status} />;
};

const getPodDataViewRows = (
  rowData: RowProps<PodKind, PodRowData>[],
  tableColumns: ConsoleDataViewColumn<PodKind>[],
  showNodes: boolean,
  podMetrics: UIActions.PodMetrics,
): ConsoleDataViewRow[] => {
  return rowData.map(({ obj }) => {
    const { name, namespace, creationTimestamp, labels } = obj.metadata;
    const { readyCount, totalContainers } = podReadiness(obj);
    const phase = podPhase(obj);
    const restarts = podRestarts(obj);
    const resourceKind = referenceFor(obj);
    const context = { [resourceKind]: obj };
    const bytes = podMetrics?.memory?.[namespace]?.[name];
    const cores = podMetrics?.cpu?.[namespace]?.[name];

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(PodModel)}
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
        cell: <PodStatus pod={obj} />,
      },
      [tableColumnInfo[3].id]: {
        cell: `${readyCount}/${totalContainers}`,
      },
      [tableColumnInfo[4].id]: {
        cell: <>{restarts}</>,
      },
      [tableColumnInfo[5].id]: {
        cell: showNodes ? (
          <ResourceLink kind="Node" name={obj.spec?.nodeName || ''} namespace={namespace} />
        ) : (
          <OwnerReferences resource={obj} />
        ),
      },
      [tableColumnInfo[6].id]: {
        cell: bytes ? `${formatBytesAsMiB(bytes)} MiB` : DASH,
      },
      [tableColumnInfo[7].id]: {
        cell: <Cores cores={cores} />,
      },
      [tableColumnInfo[8].id]: {
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
      [tableColumnInfo[9].id]: {
        cell: <ResourceLink kind="Node" name={obj.spec.nodeName} namespace={namespace} />,
      },
      [tableColumnInfo[10].id]: {
        cell: <LabelList kind="Pod" labels={labels || {}} />,
      },
      [tableColumnInfo[11].id]: {
        cell: obj?.status?.podIP ?? DASH,
      },
      [tableColumnInfo[12].id]: {
        cell: <PodTraffic podName={name || ''} namespace={namespace} />,
      },
      [tableColumnInfo[13].id]: {
        cell: <LazyActionMenu context={context} isDisabled={phase === 'Terminating'} />,
        props: {
          ...actionsCellProps,
        },
      },
    };

    return tableColumns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

export const PodList: FC<PodListProps> = ({
  showNamespaceOverride,
  showNodes,
  data,
  loaded,
  loadError,
  hideNameLabelFilters,
  hideLabelFilter,
  hideColumnManagement,
  selectedColumns,
  ...props
}) => {
  const { t } = useTranslation();
  const columns = usePodsColumns(showNodes);
  const podMetrics = useSelector<RootState, UIActions.PodMetrics>(({ UI }) => {
    return UI.getIn(['metrics', 'pod']);
  });
  const columnManagementID = referenceForModel(PodModel);
  const columnLayout = useMemo<ColumnLayout>(
    () => ({
      id: columnManagementID,
      type: t('public~Pod'),
      columns: columns.map((col) => ({
        id: col.id,
        title: col.title,
        additional: col.additional,
      })),
      selectedColumns:
        selectedColumns?.[columnManagementID]?.length > 0
          ? new Set(selectedColumns[columnManagementID])
          : new Set(),
      showNamespaceOverride,
    }),
    [columns, columnManagementID, selectedColumns, showNamespaceOverride, t],
  );
  const podStatusFilterOptions = useMemo<DataViewFilterOption[]>(
    () => [
      {
        value: 'Running',
        label: t('public~Running'),
      },
      {
        value: 'Pending',
        label: t('public~Pending'),
      },
      {
        value: 'Terminating',
        label: t('public~Terminating'),
      },
      {
        value: 'CrashLoopBackOff',
        label: t('public~CrashLoopBackOff'),
      },
      // Use title "Completed" to match what appears in the status column for the pod.
      // The pod phase is "Succeeded," but the container state is "Completed."
      {
        value: 'Succeeded',
        label: t('public~Completed'),
      },
      {
        value: 'Failed',
        label: t('public~Failed'),
      },
      {
        value: 'Unknown',
        label: t('public~Unknown'),
      },
    ],
    [t],
  );

  const additionalFilterNodes = useMemo<ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status" // is `rowFilter-pod-status`in <FilterToolbar> as a single param, not multiple
        title={t('public~Status')}
        placeholder={t('public~Filter by status')}
        options={podStatusFilterOptions}
      />,
    ],
    [t, podStatusFilterOptions],
  );
  const matchesAdditionalFilters = useCallback(
    (resource: PodKind, filters: PodFilters) =>
      filters.status.length === 0 ||
      filters.status.includes(
        String(
          podStatusFilterOptions.find((option) => option.value === podPhaseFilterReducer(resource))
            ?.value,
        ),
      ),
    [podStatusFilterOptions],
  );

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<PodKind, PodRowData, PodFilters>
        {...props}
        label={PodModel.labelPlural}
        data={data}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        columnLayout={columnLayout}
        columnManagementID={columnManagementID}
        initialFilters={{ ...initialFiltersDefault, status: [] }}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
        getDataViewRows={(rowData, tableColumns) =>
          getPodDataViewRows(rowData, tableColumns, showNodes, podMetrics)
        }
        hideNameLabelFilters={hideNameLabelFilters}
        hideLabelFilter={hideLabelFilter}
        hideColumnManagement={hideColumnManagement}
      />
    </Suspense>
  );
};

export const PodsPage: FC<PodPageProps> = ({
  canCreate = true,
  namespace,
  showNodes,
  showTitle = true,
  selector,
  fieldSelector,
  hideNameLabelFilters,
  hideLabelFilter,
  hideColumnManagement,
  showNamespaceOverride,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [selectedColumns, , userSettingsLoaded] = useUserSettingsCompatibility<TableColumnsType>(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  );

  useEffect(() => {
    if (showMetrics) {
      const updateMetrics = () =>
        fetchPodMetrics(namespace || '')
          .then((result) => dispatch(UIActions.setPodMetrics(result)))
          .catch((e) => {
            // Just log the error here. Showing a warning alert could be more annoying
            // than helpful. It should be obvious there are no metrics in the list, and
            // if monitoring is broken, it'll be really apparent since none of the
            // graphs and dashboards will load in the UI.
            // eslint-disable-next-line no-console
            console.error('Unable to fetch pod metrics', e);
          });
      updateMetrics();
      const id = setInterval(updateMetrics, 30 * 1000);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  const [pods, loaded, loadError] = useK8sWatchResource<PodKind[]>({
    kind: PodModel.kind,
    isList: true,
    namespaced: true,
    namespace,
    selector,
    fieldSelector,
  });

  const resourceKind = referenceForModel(PodModel);
  const accessReview = {
    groupVersionKind: resourceKind,
    namespace: namespace || 'default',
  };
  if (!userSettingsLoaded) {
    return null;
  }

  return (
    <>
      <ListPageHeader title={showTitle ? t('public~Pods') : ''}>
        {canCreate && (
          <ListPageCreate groupVersionKind={resourceKind} createAccessReview={accessReview}>
            {t('public~Create Pod')}
          </ListPageCreate>
        )}
      </ListPageHeader>
      <ListPageBody>
        <PodList
          data={pods}
          loaded={loaded}
          loadError={loadError}
          showNamespaceOverride={showNamespaceOverride}
          showNodes={showNodes}
          namespace={namespace}
          hideNameLabelFilters={hideNameLabelFilters}
          hideLabelFilter={hideLabelFilter}
          hideColumnManagement={hideColumnManagement}
          selectedColumns={selectedColumns}
        />
      </ListPageBody>
    </>
  );
};

type CoresProps = {
  cores: number;
};

type PodStatusPopoverProps = {
  bodyContent: string;
  headerContent?: string;
  footerContent?: ReactNode | string;
  status: string;
};

export type PodStatusProps = {
  pod: PodKind;
};

export type PodDetailsListProps = {
  pod: PodKind;
};

type PodFilters = ResourceFilters & { status: string[] };

type PodRowData = {
  obj: PodKind;
};
type PodListProps = {
  data: PodKind[];
  loaded: boolean;
  loadError: unknown;
  showNodes?: boolean;
  showNamespaceOverride?: boolean;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
  namespace?: string;
  selectedColumns?: TableColumnsType;
};

type PodPageProps = {
  canCreate?: boolean;
  fieldSelector?: string;
  namespace?: string;
  selector?: Selector;
  showTitle?: boolean;
  showNodes?: boolean;
  hideLabelFilter?: boolean;
  hideNameLabelFilters?: boolean;
  hideColumnManagement?: boolean;
  showNamespaceOverride?: boolean;
};
