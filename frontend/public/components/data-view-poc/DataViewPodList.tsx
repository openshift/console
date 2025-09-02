/* eslint-disable no-console */
import * as React from 'react';
import {
  DataView,
  DataViewCheckboxFilter,
  DataViewState,
  DataViewTable,
  DataViewTd,
  DataViewTextFilter,
  DataViewTh,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
} from '@patternfly/react-data-view';
import {
  InnerScrollContainer,
  sortable,
  SortByDirection,
  Tbody,
  Td,
  ThProps,
  Tr,
} from '@patternfly/react-table';
import { useNavigate, useSearchParams } from 'react-router-dom-v5-compat';
import {
  PodKind,
  podPhase,
  podPhaseFilterReducer,
  podReadiness,
  podRestarts,
  referenceFor,
  referenceForModel,
  RowProps,
  TableColumn,
} from '../../module/k8s';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux';
import { css } from '@patternfly/react-styles';
import { formatBytesAsMiB, formatCores, LabelList, OwnerReferences, ResourceLink } from '../utils';

import { PodTraffic } from '../pod-traffic';
import { getLabelsAsString, LazyActionMenu } from '@console/shared';
import { PodStatus } from '../pod';
import { sortResourceByValue } from '../factory/Table/sort';
import * as UIActions from '../../actions/ui';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { Bullseye, Pagination, ToolbarFilter, Tooltip } from '@patternfly/react-core';
import {
  ResponsiveAction,
  ResponsiveActions,
  SkeletonTableBody,
} from '@patternfly/react-component-groups';
import DataViewFilters, {
  DataViewFilterOption,
} from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { ColumnLayout } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import AutocompleteInput from '../autocomplete';
import { ColumnsIcon } from '@patternfly/react-icons';
import { createColumnManagementModal } from '../modals';
import { useActiveColumns } from '../factory/Table/active-columns-hook';
import { PodModel } from '../../models';
import { useExactSearch } from '@console/app/src/components/user-preferences/search/useExactSearch';
import { exactMatch, fuzzyCaseInsensitive } from '../factory/table-filters';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';

/**
 * Copy paste section
 * These are some setup functions and variables that are defined in the public/components/pod.tsx file
 * Reason to copy this is not to introduce any introduce any potential cyclic imports
 */

const columnManagementID = referenceForModel(PodModel);

type PodRowData = {
  showNodes?: boolean;
};

const kind = 'Pod';

const podColumnInfo = Object.freeze({
  name: {
    classes: '',
    id: 'name',
    title: 'public~Name',
  },
  namespace: {
    classes: '',
    id: 'namespace',
    title: 'public~Namespace',
  },
  status: {
    classes: '',
    id: 'status',
    title: 'public~Status',
  },
  ready: {
    classes: 'pf-m-nowrap',
    id: 'ready',
    title: 'public~Ready',
  },
  restarts: {
    classes: 'pf-m-nowrap',
    id: 'restarts',
    title: 'public~Restarts',
  },
  owner: {
    classes: '',
    id: 'owner',
    title: 'public~Owner',
  },
  node: {
    classes: '',
    id: 'node',
    title: 'public~Node',
  },
  memory: {
    classes: '',
    id: 'memory',
    title: 'public~Memory',
  },
  cpu: {
    classes: '',
    id: 'cpu',
    title: 'public~CPU',
  },
  created: {
    classes: '',
    id: 'created',
    title: 'public~Created',
  },
  labels: {
    classes: '',
    id: 'labels',
    title: 'public~Labels',
  },
  ipaddress: {
    classes: '',
    id: 'ipaddress',
    title: 'public~IP address',
  },
  traffic: {
    classes: '',
    id: 'trafficStatus',
    title: 'public~Receiving Traffic',
  },
});

const getColumns = (showNodes: boolean, t: TFunction): TableColumn<PodKind>[] => [
  {
    title: t(podColumnInfo.name.title),
    id: podColumnInfo.name.id,
    sort: 'metadata.name',
    transforms: [sortable],
    props: {
      className: podColumnInfo.name.classes,
      isStickyColumn: true,
      modifier: 'nowrap',
    },
  },
  {
    title: t(podColumnInfo.namespace.title),
    id: podColumnInfo.namespace.id,
    sort: 'metadata.namespace',
    transforms: [sortable],
    props: { className: podColumnInfo.namespace.classes, modifier: 'nowrap' },
  },
  {
    title: t(podColumnInfo.status.title),
    id: podColumnInfo.status.id,
    sort: (data, direction) => data.sort(sortResourceByValue<PodKind>(direction, podPhase)),
    transforms: [sortable],
    props: { className: podColumnInfo.status.classes, modifier: 'nowrap' },
  },
  {
    title: t(podColumnInfo.ready.title),
    id: podColumnInfo.ready.id,
    sort: (data, direction) =>
      data.sort(sortResourceByValue<PodKind>(direction, (obj) => podReadiness(obj).readyCount)),
    transforms: [sortable],
    props: { className: podColumnInfo.ready.classes, modifier: 'nowrap' },
  },
  {
    title: t(podColumnInfo.restarts.title),
    id: podColumnInfo.restarts.id,
    sort: (data, direction) => data.sort(sortResourceByValue<PodKind>(direction, podRestarts)),
    transforms: [sortable],
    props: { className: podColumnInfo.restarts.classes, modifier: 'nowrap' },
  },
  {
    title: showNodes ? t(podColumnInfo.node.title) : t(podColumnInfo.owner.title),
    id: podColumnInfo.owner.id,
    sort: showNodes ? 'spec.nodeName' : 'metadata.ownerReferences[0].name',
    transforms: [sortable],
    props: { className: podColumnInfo.owner.classes, modifier: 'nowrap' },
  },
  {
    title: t(podColumnInfo.memory.title),
    id: podColumnInfo.memory.id,
    sort: (data, direction) =>
      data.sort(
        sortResourceByValue<PodKind>(direction, (obj) => UIActions.getPodMetric(obj, 'memory')),
      ),
    transforms: [sortable],
    props: { className: podColumnInfo.memory.classes, modifier: 'nowrap' },
  },
  {
    title: t(podColumnInfo.cpu.title),
    id: podColumnInfo.cpu.id,
    sort: (data, direction) =>
      data.sort(
        sortResourceByValue<PodKind>(direction, (obj) => UIActions.getPodMetric(obj, 'cpu')),
      ),
    transforms: [sortable],
    props: { className: podColumnInfo.cpu.classes, modifier: 'nowrap' },
  },
  {
    title: t(podColumnInfo.created.title),
    id: podColumnInfo.created.id,
    sort: 'metadata.creationTimestamp',
    transforms: [sortable],
    props: { className: podColumnInfo.created.classes, modifier: 'nowrap' },
  },
  {
    title: t(podColumnInfo.node.title),
    id: podColumnInfo.node.id,
    sort: 'spec.nodeName',
    transforms: [sortable],
    props: { className: podColumnInfo.node.classes, modifier: 'nowrap' },
    additional: true,
  },
  {
    title: t(podColumnInfo.labels.title),
    id: podColumnInfo.labels.id,
    sort: 'metadata.labels',
    transforms: [sortable],
    props: { className: podColumnInfo.labels.classes, modifier: 'nowrap' },
    additional: true,
  },
  {
    title: t(podColumnInfo.ipaddress.title),
    id: podColumnInfo.ipaddress.id,
    sort: 'status.podIP',
    transforms: [sortable],
    props: { className: podColumnInfo.ipaddress.classes, modifier: 'nowrap' },
    additional: true,
  },
  {
    title: t(podColumnInfo.traffic.title),
    id: podColumnInfo.traffic.id,
    props: { className: podColumnInfo.traffic.classes, modifier: 'nowrap' },
    additional: true,
  },
  {
    title: '',
    id: 'actions',
    props: {
      isStickyColumn: true,
      stickyMinWidth: '69px', // TODO: make this value a constant
      isActionCell: true,
    },
  },
];

/**
 * End of copy paste section public/components/pod.tsx file
 */

/**
 * Maps data from RowProps<PodKind, PodRowData>[] to DataViewTd[]
 */
function useDataViewPodRow(
  data: RowProps<PodKind, PodRowData>[],
  columns: (DataViewTh & { id?: string })[],
) {
  const { t } = useTranslation();
  // We have to iterate over the redux state as the data view rows are not separate entities.
  // The data is referenced by indexes
  // In a finished implementation, the data should combined within the state to avoid extra iteration
  const allCores = useSelector<RootState, [number, number][]>(({ UI }) => {
    return data.map(({ obj: pod }) => {
      const { name, namespace } = pod.metadata;
      const metrics = UI.getIn(['metrics', 'pod']);
      return [metrics?.cpu?.[namespace]?.[name], metrics?.memory?.[namespace]?.[name]];
    });
  });
  // Ideally, this result should be memoized
  return data.map(({ obj: pod, rowData: { showNodes } }, index) => {
    const { name, namespace, creationTimestamp, labels } = pod.metadata;
    const [cores, bytes] = allCores[index];
    const { readyCount, totalContainers } = podReadiness(pod);
    const phase = podPhase(pod);
    const restarts = podRestarts(pod);
    const resourceKind = referenceFor(pod);
    const context = { [resourceKind]: pod };
    const rowCells = {
      [podColumnInfo.name.id]: {
        id: podColumnInfo.name.id,
        props: {
          className: podColumnInfo.name.classes,
          isStickyColumn: true,
          hasRightBorder: true,
        },
        cell: <ResourceLink kind={kind} name={name} namespace={namespace} />,
      },
      [podColumnInfo.namespace.id]: {
        id: podColumnInfo.namespace.id,
        props: {
          className: css(podColumnInfo.namespace.classes, 'co-break-word'),
        },
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [podColumnInfo.status.id]: {
        id: podColumnInfo.status.id,
        props: { className: podColumnInfo.status.classes },
        cell: <PodStatus pod={pod} />,
      },
      [podColumnInfo.ready.id]: {
        id: podColumnInfo.ready.id,
        props: { className: podColumnInfo.ready.classes },
        cell: `${readyCount}/${totalContainers}`,
      },
      [podColumnInfo.restarts.id]: {
        id: podColumnInfo.restarts.id,
        props: { className: podColumnInfo.restarts.classes },
        cell: restarts,
      },
      [podColumnInfo.owner.id]: {
        id: podColumnInfo.owner.id,
        props: { className: podColumnInfo.owner.classes },
        cell: showNodes ? (
          <ResourceLink kind="Node" name={pod.spec.nodeName} namespace={namespace} />
        ) : (
          <OwnerReferences resource={pod} />
        ),
      },
      [podColumnInfo.memory.id]: {
        id: podColumnInfo.memory.id,
        props: { className: podColumnInfo.memory.classes },
        cell: bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-',
      },
      [podColumnInfo.cpu.id]: {
        id: podColumnInfo.cpu.id,
        props: { className: podColumnInfo.cpu.classes },
        cell: cores ? t('public~{{numCores}} cores', { numCores: formatCores(cores) }) : '-',
      },
      [podColumnInfo.created.id]: {
        id: podColumnInfo.created.id,
        props: { className: podColumnInfo.created.classes },
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
      [podColumnInfo.node.id]: {
        id: podColumnInfo.node.id,
        props: { className: podColumnInfo.node.classes },
        cell: <ResourceLink kind="Node" name={pod.spec.nodeName} namespace={namespace} />,
      },
      [podColumnInfo.labels.id]: {
        id: podColumnInfo.labels.id,
        props: { className: podColumnInfo.labels.classes },
        cell: <LabelList kind={kind} labels={labels} />,
      },
      [podColumnInfo.ipaddress.id]: {
        id: podColumnInfo.ipaddress.id,
        props: { className: podColumnInfo.ipaddress.classes },
        cell: pod?.status?.podIP ?? '-',
      },
      [podColumnInfo.traffic.id]: {
        id: podColumnInfo.traffic.id,
        props: { className: podColumnInfo.traffic.classes },
        cell: <PodTraffic podName={name} namespace={namespace} />,
      },
    };
    const dataViewRow: DataViewTd[] = columns.map(({ id }) => rowCells[id]);
    const actionsRow: DataViewTd = {
      id: '',
      props: {
        isStickyColumn: true,
        stickyMinWidth: '0',
        hasLeftBorder: true,
        isActionCell: true,
      },
      cell: <LazyActionMenu context={context} isDisabled={phase === 'Terminating'} />,
    };
    // Always add the actions column
    dataViewRow.push(actionsRow);
    return dataViewRow;
  });
}

/**
 * The sorting logic was copied over from public/components/factory/Table/VirtualizedTable.tsx file
 * For the most part it is 1:1
 * column removal based on screen size was omitted from POC
 * the columnShift attribute was omitted from the POC
 */
function useDataViewSort({
  columns,
  sortColumnIndex,
  sortDirection,
}: {
  columns: (DataViewTh & { title: string })[];
  sortColumnIndex?: number;
  sortDirection?: SortByDirection;
}) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = React.useState<{
    index: number;
    direction: SortByDirection;
  }>({
    index: sortColumnIndex ?? 0,
    direction: sortDirection || SortByDirection.asc,
  });

  const applySort = React.useCallback(
    (index, direction) => {
      const url = new URL(window.location.href);
      const sp = new URLSearchParams(window.location.search);

      const sortColumn = columns[index];
      if (sortColumn) {
        sp.set('orderBy', direction);
        sp.set('sortBy', sortColumn.title);
        navigate(`${url.pathname}?${sp.toString()}${url.hash}`, {
          replace: true,
        });
        setSortBy({
          index,
          direction,
        });
      }
    },
    [columns, navigate],
  );

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const columnIndex = _.findIndex(columns, { title: sp.get('sortBy') });

    if (!Number.isNaN(columnIndex) && columns[columnIndex]) {
      const sortOrder =
        sp.get('orderBy') === SortByDirection.desc.valueOf()
          ? SortByDirection.desc
          : SortByDirection.asc;
      setSortBy({
        index: columnIndex,
        direction: sortOrder,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSort = React.useCallback(
    (event, index, direction) => {
      event.preventDefault();
      applySort(index, direction);
    },
    [applySort],
  );
  return { sortBy, onSort };
}

// Simple type guard for checking what type of data view column is used
function isDataViewConfigurableColumn(
  column: DataViewTh,
): column is {
  cell: React.ReactNode;
  props: ThProps;
} {
  return (column as any)?.cell !== undefined;
}

function useDataViewData({
  filteredData,
  showNodes,
  showNamespaceOverride,
}: {
  filteredData: PodKind[];
  showNodes: boolean;
  showNamespaceOverride?: boolean;
}) {
  const { t } = useTranslation();
  // Couple of hooks to persist the pagination information in URL
  const [searchParams, setSearchParams] = useSearchParams();
  const pagination = useDataViewPagination({
    perPage: 50,
    searchParams,
    setSearchParams,
  });

  const columns = React.useMemo(() => getColumns(showNodes, t), [showNodes, t]);
  const [activeColumns] = useActiveColumns({
    columns,
    showNamespaceOverride,
    columnManagementID,
  });
  // extend the type with custom attributes so we can access original sorting function and propagate additional data to lookup filter arguments in the URL
  const dataViewColumns: (DataViewTh & {
    id: string;
    sortFunction?:
      | string
      | ((filteredData: PodKind[], sortDirection: SortByDirection) => PodKind[]);
    title: string;
  })[] = activeColumns.map((column, index) => ({
    id: column.id,
    sortFunction: column.sort,
    title: t(column.title),
    props: {
      className: column.props.classes,
      ...(column.sort && {
        sort: {
          columnIndex: index,
          sortBy: {
            defaultDirection: SortByDirection.asc,
            direction: SortByDirection.asc,
            index: 0,
          },
        },
      }),
      isStickyColumn: column.props.isStickyColumn,
      stickyMinWidth: column.props.stickyMinWidth,
      isActionCell: column.props.isActionCell,
      modifier: column.props.modifier,
    } as ThProps,
    cell: column.title ? (
      <span>{t(column.title)}</span>
    ) : (
      <span className="pf-v6-u-screen-reader">{t('public~Actions')}</span>
    ),
  }));

  const { sortBy, onSort } = useDataViewSort({
    columns: dataViewColumns,
  });

  /**
   * The sorting logic was copied over from public/components/factory/Table/VirtualizedTable.tsx file
   * Again, the logic stays the same, but it slightly adjusted to the new data structure
   *  */

  const sortedData = React.useMemo(() => {
    const sortColumn = dataViewColumns[sortBy.index];
    if (!isDataViewConfigurableColumn(sortColumn)) {
      return filteredData;
    } else if (
      sortColumn &&
      isDataViewConfigurableColumn(sortColumn) &&
      typeof sortColumn?.props.sort === 'string'
    ) {
      return filteredData.sort(
        sortResourceByValue(sortBy.direction, (obj) =>
          // In filteredData view sort is never a string but we can keep the code for now
          _.get(obj, (sortColumn?.props?.sort as unknown) as string, ''),
        ),
      );
    } else if (typeof sortColumn?.sortFunction === 'string') {
      return filteredData.sort(
        sortResourceByValue(sortBy.direction, (obj) =>
          _.get(obj, sortColumn.sortFunction as string),
        ),
      );
    } else if (typeof sortColumn?.sortFunction === 'function') {
      return sortColumn?.sortFunction?.(filteredData, sortBy.direction);
    }
    return filteredData;
  }, [dataViewColumns, filteredData, sortBy.direction, sortBy.index]);

  const transformedData = sortedData
    .map<RowProps<PodKind, PodRowData>>((pod, index) => ({
      obj: pod,
      rowData: { showNodes },
      activeColumnIDs: new Set<string>(),
      index,
    }))
    .slice(
      (pagination.page - 1) * pagination.perPage,
      (pagination.page - 1) * pagination.perPage + pagination.perPage,
    );

  const dataViewRows = useDataViewPodRow(transformedData, dataViewColumns);
  /**
   * There is a little bit of chicken and egg problem here
   * We have to tack on the sort information to the columns once all data is available
   * Once the data structure is adopted, should done in one go
   */
  dataViewColumns.forEach((column) => {
    if (isDataViewConfigurableColumn(column) && column.sortFunction !== undefined) {
      column.props.sort.sortBy.index = sortBy.index;
      column.props.sort.sortBy.direction = sortBy.direction;
      column.props.sort.onSort = onSort;
    }
  });
  return { dataViewRows, dataViewColumns, pagination };
}

// Mostly copied over from public/components/filter-toolbar.tsx
// Only taken the labels filter as it is unique to OCP and not in data view
// Seems like it could be generalized and transferred as a new filter type to data view
const DataViewLabelFilter = ({
  data,
  title,
  filterId,
  showToolbarItem,
  onChange,
}: {
  data: PodKind[];
  filterId: string;
  title: string;
  showToolbarItem?: boolean;
  onChange?: (key: string, newValues) => void; // TODO: add type for newValues
}) => {
  const { t } = useTranslation();
  const [labelInputText, setLabelInputText] = React.useState('');
  const [searchParams] = useSearchParams();

  const labelSelection = searchParams.get(filterId)?.split(',') ?? [];
  const applyLabelFilters = (values: string[]) => {
    setLabelInputText('');
    onChange?.(filterId, values.join(','));
  };

  return (
    <ToolbarFilter
      labels={labelSelection}
      deleteLabelGroup={() => {
        setLabelInputText('');
        applyLabelFilters([]);
      }}
      deleteLabel={(f, chip: string) => {
        setLabelInputText('');
        applyLabelFilters(_.difference(labelSelection, [chip]));
      }}
      categoryName={title}
      showToolbarItem={showToolbarItem}
    >
      <div className="pf-v6-c-input-group co-filter-group">
        <AutocompleteInput
          color="purple"
          onSuggestionSelect={(selected) => {
            applyLabelFilters(_.uniq([...labelSelection, selected]));
          }}
          showSuggestions
          textValue={labelInputText}
          setTextValue={setLabelInputText}
          placeholder={t('public~Filter by label')}
          data={data}
        />
      </div>
    </ToolbarFilter>
  );
};

type DataViewPodListProps = {
  loaded: boolean;
  data: PodKind[];
  showNodes?: boolean;
  columnLayout?: ColumnLayout;
  showNamespaceOverride?: boolean;
  hideNameLabelFilters?: boolean;
  hideLabelFilter?: boolean;
  hideColumnManagement?: boolean;
};

const DataViewPodList = ({
  data,
  showNodes,
  loaded,
  columnLayout,
  showNamespaceOverride,
  hideNameLabelFilters,
  hideLabelFilter,
  hideColumnManagement,
}: DataViewPodListProps) => {
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isExactSearch] = useExactSearch();

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters({
    initialFilters: { status: [], name: '', labels: '' },
    searchParams,
    setSearchParams,
  });

  const filterOptions: DataViewFilterOption[] = React.useMemo(
    () => [
      { value: 'Running', label: t('public~Running') },
      { value: 'Pending', label: t('public~Pending') },
      { value: 'Terminating', label: t('public~Terminating') },
      { value: 'CrashLoopBackOff', label: t('public~CrashLoopBackOff') },
      // Use title "Completed" to match what appears in the status column for the pod.
      // The pod phase is "Succeeded," but the container state is "Completed."
      { value: 'Succeeded', label: t('public~Completed') },
      { value: 'Failed', label: t('public~Failed') },
      { value: 'Unknown', label: t('public~Unknown') },
    ],
    [],
  );

  const filteredData = React.useMemo(
    () =>
      data.filter((item) => {
        const nameFilter = filters.name;
        const podName = item.metadata.name;
        const filterLabelArray = filters.labels !== '' ? filters.labels.split(',') : [];
        const itemLabels = getLabelsAsString(item);

        return (
          (!filters.status ||
            filters.status.length === 0 ||
            filters.status.includes(
              String(
                filterOptions.find((option) => option.value === podPhaseFilterReducer(item))?.value,
              ),
            )) &&
          (!filters.name || isExactSearch
            ? exactMatch(nameFilter, podName)
            : fuzzyCaseInsensitive(nameFilter, podName)) &&
          (!filters.labels || filterLabelArray.every((label) => itemLabels.includes(label)))
        );
      }),
    [data, filters.name, filters.labels, filters.status, filterOptions, isExactSearch],
  );

  const { dataViewColumns, dataViewRows, pagination } = useDataViewData({
    filteredData,
    showNodes,
    showNamespaceOverride,
  });

  const bodyLoading = React.useMemo(
    () => <SkeletonTableBody rowsCount={5} columnsCount={dataViewColumns.length} />,
    [dataViewColumns.length],
  );
  const bodyEmpty = React.useMemo(
    () => (
      <Tbody>
        <Tr>
          <Td colSpan={dataViewColumns.length}>
            <Bullseye>{t('public~No Pods found')}</Bullseye>
          </Td>
        </Tr>
      </Tbody>
    ),
    [t, dataViewColumns.length],
  );
  const activeState = React.useMemo(() => {
    if (!loaded) {
      return DataViewState.loading;
    }
    if (filteredData.length === 0) {
      return DataViewState.empty;
    }

    return undefined;
  }, [filteredData.length, loaded]);

  const dataViewFiltersNodes = React.useMemo(() => {
    const showNameLabelFilters = hideNameLabelFilters !== true;
    return [
      <DataViewCheckboxFilter
        key="status"
        filterId="status" // is `rowFilter-pod-status`in <FilterToolbar> as a single param, not multiple
        title={t('public~Status')}
        placeholder={t('public~Filter by status')}
        options={filterOptions}
      />,
      showNameLabelFilters && (
        <DataViewTextFilter key="name" filterId="name" title={t('public~Name')} />
      ),
      showNameLabelFilters && hideLabelFilter !== true && (
        <DataViewLabelFilter key="labels" filterId="label" title={t('public~Label')} data={data} />
      ),
    ];
    // can't use data in the deps array is will re-compute the filters and will cause the selected category to reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOptions, t]);

  return (
    <DataView activeState={activeState}>
      <DataViewToolbar
        filters={
          <DataViewFilters values={filters} onChange={(_e, values) => onSetFilters(values)}>
            {dataViewFiltersNodes}
          </DataViewFilters>
        }
        clearAllFilters={clearAllFilters}
        actions={
          !hideColumnManagement && (
            <ResponsiveActions breakpoint="lg">
              <ResponsiveAction
                isPersistent
                variant="plain"
                onClick={() =>
                  createColumnManagementModal({
                    columnLayout,
                    noLimit: true,
                  })
                }
                aria-label={t('public~Column management')}
                data-test="manage-columns"
              >
                <Tooltip content={t('public~Manage columns')} trigger="mouseenter">
                  <ColumnsIcon />
                </Tooltip>
              </ResponsiveAction>
            </ResponsiveActions>
          )
        }
        pagination={<Pagination itemCount={filteredData.length} {...pagination} />}
      />
      <InnerScrollContainer>
        <DataViewTable
          columns={dataViewColumns}
          rows={dataViewRows}
          bodyStates={{
            empty: bodyEmpty,
            loading: bodyLoading,
          }}
          gridBreakPoint=""
          variant="compact"
        />
      </InnerScrollContainer>
    </DataView>
  );
};

// props.data is mutating and can change the filters not to work
// So we have to wait for the data to be loaded as we have to memoize the filters themselves
const DataViewPodListWrapper = (props: DataViewPodListProps) => {
  if (!props.loaded) {
    return null;
  }

  return <DataViewPodList {...props} />;
};

export default DataViewPodListWrapper;
