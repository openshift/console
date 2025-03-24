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
import { sortable, SortByDirection, Tbody, Td, ThProps, Tr } from '@patternfly/react-table';
import { useNavigate, useSearchParams } from 'react-router-dom-v5-compat';
import {
  PodKind,
  podPhase,
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
import * as classNames from 'classnames';
import { PROMETHEUS_BASE_PATH, PROMETHEUS_TENANCY_BASE_PATH } from '../graphs';
import {
  formatBytesAsMiB,
  formatCores,
  Kebab,
  LabelList,
  OwnerReferences,
  ResourceLink,
  Timestamp,
} from '../utils';
import { PodTraffic } from '../pod-traffic';
import { LazyActionMenu, useDebounceCallback } from '@console/shared';
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
import { RowFilter } from '../filter-toolbar';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import {
  ColumnLayout,
  OnFilterChange,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import useLabelSelectionFix from '../useLabelSelectionFix';
import AutocompleteInput from '../autocomplete';
import { ColumnsIcon } from '@patternfly/react-icons';
import { createColumnManagementModal } from '../modals';
import { useActiveColumns } from '../factory/Table/active-columns-hook';
import { PodModel } from '../../models';

/**
 * Copy paste section
 * These are some setup functions and variables that are defined in the public/components/pod.tsx file
 * Reason to copy this is not to introduce any introduce any potential cyclic imports
 */

const columnManagementID = referenceForModel(PodModel);

type PodRowData = {
  showNodes?: boolean;
};

const showMetrics =
  PROMETHEUS_BASE_PATH && PROMETHEUS_TENANCY_BASE_PATH && window.screen.width >= 1200;

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
    classes: classNames('pf-m-nowrap', 'pf-v6-u-w-10-on-lg', 'pf-v6-u-w-8-on-xl'),
    id: 'ready',
    title: 'public~Ready',
  },
  restarts: {
    classes: classNames('pf-m-nowrap', 'pf-v6-u-w-8-on-2xl'),
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
    classes: classNames({ 'pf-v6-u-w-10-on-2xl': showMetrics }),
    id: 'memory',
    title: 'public~Memory',
  },
  cpu: {
    classes: classNames({ 'pf-v6-u-w-10-on-2xl': showMetrics }),
    id: 'cpu',
    title: 'public~CPU',
  },
  created: {
    classes: classNames('pf-v6-u-w-10-on-2xl'),
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
    props: { className: podColumnInfo.name.classes },
  },
  {
    title: t(podColumnInfo.namespace.title),
    id: podColumnInfo.namespace.id,
    sort: 'metadata.namespace',
    transforms: [sortable],
    props: { className: podColumnInfo.namespace.classes },
  },
  {
    title: t(podColumnInfo.status.title),
    id: podColumnInfo.status.id,
    sort: (data, direction) => data.sort(sortResourceByValue<PodKind>(direction, podPhase)),
    transforms: [sortable],
    props: { className: podColumnInfo.status.classes },
  },
  {
    title: t(podColumnInfo.ready.title),
    id: podColumnInfo.ready.id,
    sort: (data, direction) =>
      data.sort(sortResourceByValue<PodKind>(direction, (obj) => podReadiness(obj).readyCount)),
    transforms: [sortable],
    props: { className: podColumnInfo.ready.classes },
  },
  {
    title: t(podColumnInfo.restarts.title),
    id: podColumnInfo.restarts.id,
    sort: (data, direction) => data.sort(sortResourceByValue<PodKind>(direction, podRestarts)),
    transforms: [sortable],
    props: { className: podColumnInfo.restarts.classes },
  },
  {
    title: showNodes ? t(podColumnInfo.node.title) : t(podColumnInfo.owner.title),
    id: podColumnInfo.owner.id,
    sort: showNodes ? 'spec.nodeName' : 'metadata.ownerReferences[0].name',
    transforms: [sortable],
    props: { className: podColumnInfo.owner.classes },
  },
  {
    title: t(podColumnInfo.memory.title),
    id: podColumnInfo.memory.id,
    sort: (data, direction) =>
      data.sort(
        sortResourceByValue<PodKind>(direction, (obj) => UIActions.getPodMetric(obj, 'memory')),
      ),
    transforms: [sortable],
    props: { className: podColumnInfo.memory.classes },
  },
  {
    title: t(podColumnInfo.cpu.title),
    id: podColumnInfo.cpu.id,
    sort: (data, direction) =>
      data.sort(
        sortResourceByValue<PodKind>(direction, (obj) => UIActions.getPodMetric(obj, 'cpu')),
      ),
    transforms: [sortable],
    props: { className: podColumnInfo.cpu.classes },
  },
  {
    title: t(podColumnInfo.created.title),
    id: podColumnInfo.created.id,
    sort: 'metadata.creationTimestamp',
    transforms: [sortable],
    props: { className: podColumnInfo.created.classes },
  },
  {
    title: t(podColumnInfo.node.title),
    id: podColumnInfo.node.id,
    sort: 'spec.nodeName',
    transforms: [sortable],
    props: { className: podColumnInfo.node.classes },
    additional: true,
  },
  {
    title: t(podColumnInfo.labels.title),
    id: podColumnInfo.labels.id,
    sort: 'metadata.labels',
    transforms: [sortable],
    props: { className: podColumnInfo.labels.classes },
    additional: true,
  },
  {
    title: t(podColumnInfo.ipaddress.title),
    id: podColumnInfo.ipaddress.id,
    sort: 'status.podIP',
    transforms: [sortable],
    props: { className: podColumnInfo.ipaddress.classes },
    additional: true,
  },
  {
    title: t(podColumnInfo.traffic.title),
    id: podColumnInfo.traffic.id,
    props: { className: podColumnInfo.traffic.classes },
    additional: true,
  },
  {
    title: '',
    id: '',
    props: { className: Kebab.columnClass },
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
  // We have to iterate over the redux state as the dw rows are not separate entities.
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
        props: { className: podColumnInfo.name.classes },
        cell: <ResourceLink kind={kind} name={name} namespace={namespace} />,
      },
      [podColumnInfo.namespace.id]: {
        id: podColumnInfo.namespace.id,
        props: { className: classNames(podColumnInfo.namespace.classes, 'co-break-word') },
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
      props: { className: Kebab.columnClass },
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
  }>({ index: sortColumnIndex ?? 0, direction: sortDirection || SortByDirection.asc });

  const applySort = React.useCallback(
    (index, direction) => {
      const url = new URL(window.location.href);
      const sp = new URLSearchParams(window.location.search);

      const sortColumn = columns[index];
      if (sortColumn) {
        sp.set('orderBy', direction);
        sp.set('sortBy', sortColumn.title);
        navigate(`${url.pathname}?${sp.toString()}${url.hash}`, { replace: true });
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

// Simple type guard for checking what type of DW column is used
function isDataViewConfigurableColumn(
  column: DataViewTh,
): column is {
  cell: React.ReactNode;
  props: ThProps;
} {
  return (column as any)?.cell !== undefined;
}

function useDataViewData({
  data,
  showNodes,
  showNamespaceOverride,
}: {
  showNamespaceOverride?: boolean;
  showNodes: boolean;
  data: PodKind[];
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
  // Slice 0 - 9 to mimic the column management, will be done later
  // extend the type with custom attributes so we can access original sorting function and propagate additional data to lookup filter arguments in the URL
  const dataViewColumns: (DataViewTh & {
    id: string;
    sortFunction?: string | ((data: PodKind[], sortDirection: SortByDirection) => PodKind[]);
    title: string;
  })[] = activeColumns.map((column, index) => ({
    id: column.id,
    sortFunction: column.sort,
    title: t(column.title),
    props: {
      className: column.props.classes,
      sort: {
        columnIndex: index,
        sortBy: {
          defaultDirection: SortByDirection.asc,
          direction: SortByDirection.asc,
          index: 0,
        },
      },
    } as ThProps,
    cell: <span>{t(column.title)}</span>,
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
      return data;
    } else if (
      sortColumn &&
      isDataViewConfigurableColumn(sortColumn) &&
      typeof sortColumn?.props.sort === 'string'
    ) {
      return data.sort(
        sortResourceByValue(sortBy.direction, (obj) =>
          // In data view sort is never a string but we can keep the code for now
          _.get(obj, (sortColumn?.props?.sort as unknown) as string, ''),
        ),
      );
    } else if (typeof sortColumn?.sortFunction === 'string') {
      return data.sort(
        sortResourceByValue(sortBy.direction, (obj) =>
          _.get(obj, sortColumn.sortFunction as string),
        ),
      );
    } else if (typeof sortColumn?.sortFunction === 'function') {
      return sortColumn?.sortFunction?.(data, sortBy.direction);
    }
    return data;
  }, [dataViewColumns, data, sortBy.direction, sortBy.index]);

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
    if (isDataViewConfigurableColumn(column)) {
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
const LabelsFilter = ({
  onFilterChange,
  data,
  title,
  filterId,
  showToolbarItem,
}: {
  onFilterChange: OnFilterChange;
  data: PodKind[];
  filterId: string;
  title: string;
  showToolbarItem?: boolean;
}) => {
  const { t } = useTranslation();
  const [labelInputText, setLabelInputText] = React.useState('');
  const [searchParams] = useSearchParams();

  const [labelSelection, onLabelSelectionChange] = useLabelSelectionFix(searchParams, filterId);
  const applyLabelFilters = (values: string[]) => {
    setLabelInputText('');
    onLabelSelectionChange(values);
    onFilterChange(filterId, { all: values });
  };

  return (
    <ToolbarFilter
      deleteLabelGroup={() => {
        setLabelInputText('');
        applyLabelFilters([]);
      }}
      labels={labelSelection}
      deleteLabel={(f, chip: string) => {
        setLabelInputText('');
        applyLabelFilters(_.difference(labelSelection, [chip]));
      }}
      categoryName={title}
      showToolbarItem={showToolbarItem}
    >
      <div className="pf-v6-c-input-group co-filter-group">
        <AutocompleteInput
          className="co-text-node"
          onSuggestionSelect={(selected) => {
            applyLabelFilters(_.uniq([...labelSelection, selected]));
          }}
          showSuggestions
          textValue={labelInputText}
          setTextValue={setLabelInputText}
          placeholder={t('public~Search by label...')}
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
  filters?: RowFilter<PodKind>[];
  onFilterChange: OnFilterChange;
  columnLayout?: ColumnLayout;
  showNamespaceOverride?: boolean;
};

const DataViewPodList = ({
  data,
  showNodes,
  loaded,
  filters,
  onFilterChange,
  columnLayout,
  showNamespaceOverride,
}: DataViewPodListProps) => {
  const { t } = useTranslation();
  const { dataViewColumns, dataViewRows, pagination } = useDataViewData({
    data,
    showNodes,
    showNamespaceOverride,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = filters?.reduce((acc, curr) => {
    acc[curr.filterGroupName] = searchParams.getAll(curr.filterGroupName);
    return acc;
  }, {});
  const debouncedOnFilterChange = useDebounceCallback(onFilterChange, 500);
  const debouncedSetSearchParams = useDebounceCallback(setSearchParams, 500);
  // Currently there is a big that will only return the first item from the query, even though there are multiple items for one group
  const { onSetFilters, filters: dataViewFilters } = useDataViewFilters({
    searchParams,
    setSearchParams: debouncedSetSearchParams,
    initialFilters,
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
    if (data.length === 0) {
      return DataViewState.empty;
    }

    return undefined;
  }, [data.length, loaded]);
  const filtersMap = React.useMemo(() => {
    return filters.reduce<{
      [filterGroup: string]: Omit<RowFilter<PodKind>, 'reducer'> & { all?: string[] };
    }>(
      (acc, filter) => {
        acc[filter.filterGroupName] = { ...filter, all: filter.items.map((item) => item.id) };
        return acc;
      },
      {
        name: {
          filterGroupName: 'name',
          type: 'Name',
          items: [],
        },
      },
    );
  }, [filters]);
  function handleFilter(_e, filterConfig: { [filterId: string]: unknown }) {
    onSetFilters(filterConfig);
    Object.entries(filterConfig).map(([filterKey, filterValue]) => {
      const filter = filtersMap[filterKey];
      if (filter && filter.all) {
        debouncedOnFilterChange(filter.type, {
          selected: Array.isArray(filterValue) ? filterValue : [filterValue],
          all: filter.all,
        });
      } else if (filter && typeof filterValue === 'string') {
        debouncedOnFilterChange(filter.filterGroupName, { selected: [filterValue] });
      }
    });
  }

  const dataViewFiltersNodes = React.useMemo(() => {
    return [
      ...filters?.map((filter, index) => {
        if (filter.items) {
          return (
            <DataViewCheckboxFilter
              key={filter.filterGroupName}
              filterId={filter.filterGroupName}
              title={filter.filterGroupName}
              placeholder={`Filter by ${filter.filterGroupName}`}
              options={filter.items.map((option) => ({
                label: option.title,
                value: option.id,
              }))}
            />
          );
        }
        return <div key={index}>Foobar</div>;
      }),
      <DataViewTextFilter key="name" filterId="name" title={t('public~Name')} />,
      <LabelsFilter
        key="labels"
        filterId="labels"
        title={t('public~Label')}
        data={data}
        onFilterChange={onFilterChange}
      />,
    ];
    // can't use data in the deps array is will re-compute the filters and will cause the selected category to reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, t, onFilterChange]);

  return (
    <DataView activeState={activeState}>
      <DataViewToolbar
        filters={
          <DataViewFilters values={dataViewFilters} onChange={handleFilter}>
            {dataViewFiltersNodes}
          </DataViewFilters>
        }
        actions={
          <ResponsiveActions breakpoint="lg">
            <ResponsiveAction
              isPersistent
              variant="plain"
              onClick={() =>
                createColumnManagementModal({
                  columnLayout,
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
        }
        pagination={<Pagination itemCount={data.length} {...pagination} />}
      />
      <DataViewTable
        columns={dataViewColumns}
        rows={dataViewRows}
        bodyStates={{
          empty: bodyEmpty,
          loading: bodyLoading,
        }}
      />
    </DataView>
  );
};

// props.data is mutating and can change the filters not to work
// Sow e have to wait for the data to be loaded as we have to memoize the filters themselves
const DataViewPodListWrapper = (props: DataViewPodListProps) => {
  if (!props.loaded) {
    return null;
  }

  return <DataViewPodList {...props} />;
};

export default DataViewPodListWrapper;
