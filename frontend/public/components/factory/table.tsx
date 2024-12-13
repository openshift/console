import * as _ from 'lodash-es';
import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import {
  TableGridBreakpoint,
  SortByDirection,
  OnSelect,
  Table as PfTable,
  Tr,
  Tbody,
  Td,
  IRow,
  ISortBy,
  OnSort,
} from '@patternfly/react-table';
import * as classNames from 'classnames';
import { CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import {
  AutoSizer,
  VirtualTableBody,
  WindowScroller,
} from '@patternfly/react-virtualized-extension';
import { Scroll } from '@patternfly/react-virtualized-extension/dist/js/components/Virtualized/types';
import { useNavigate } from 'react-router-dom-v5-compat';
import { getMachinePhase } from '@console/shared/src/selectors/machine';
import { getMachineSetInstanceType } from '@console/shared/src/selectors/machineSet';
import { pvcUsed } from '@console/shared/src/sorts/pvc';
import { snapshotSize, snapshotSource } from '@console/shared/src/sorts/snapshot';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';
import { getName } from '@console/shared/src/selectors/common';
import { useDeepCompareMemoize } from '@console/shared/src/hooks/deep-compare-memoize';
import { PackageManifestKind } from '@console/operator-lifecycle-manager/src/types';
import { defaultChannelFor } from '@console/operator-lifecycle-manager/src/components';
import {
  RowFilter as RowFilterExt,
  K8sResourceKindReference,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { RowFilter } from '../filter-toolbar';
import * as UIActions from '../../actions/ui';
import { alertingRuleStateOrder, alertSeverityOrder } from '../monitoring/utils';
import { ingressValidHosts } from '../ingress';
import { convertToBaseValue, EmptyBox, StatusBox, WithScrollContainer } from '../utils';
import {
  CustomResourceDefinitionKind,
  K8sResourceKind,
  PodKind,
  MachineKind,
  VolumeSnapshotKind,
  ClusterOperator,
} from '../../module/k8s/types';
import { getClusterOperatorStatus } from '../../module/k8s/cluster-operator';
import { getClusterOperatorVersion, getJobTypeAndCompletions } from '../../module/k8s';
import { getLatestVersionForCRD } from '../../module/k8s/k8s';
import { getTemplateInstanceStatus } from '../../module/k8s/template';
import { podPhase, podReadiness, podRestarts } from '../../module/k8s/pods';
import { useTableData } from './table-data-hook';
import TableHeader from './Table/TableHeader';

const sorts = {
  alertingRuleStateOrder,
  alertSeverityOrder,
  crdLatestVersion: (crd: CustomResourceDefinitionKind): string => getLatestVersionForCRD(crd),
  daemonsetNumScheduled: (daemonset) =>
    _.toInteger(_.get(daemonset, 'status.currentNumberScheduled')),
  dataSize: (resource) => _.size(_.get(resource, 'data')) + _.size(_.get(resource, 'binaryData')),
  ingressValidHosts,
  instanceType: (obj): string => getMachineSetInstanceType(obj),
  jobCompletionsSucceeded: (job) => job?.status?.succeeded || 0,
  jobType: (job) => getJobTypeAndCompletions(job).type,
  numReplicas: (resource) => _.toInteger(_.get(resource, 'status.replicas')),
  namespaceCPU: (ns: K8sResourceKind): number => UIActions.getNamespaceMetric(ns, 'cpu'),
  namespaceMemory: (ns: K8sResourceKind): number => UIActions.getNamespaceMetric(ns, 'memory'),
  podCPU: (pod: PodKind): number => UIActions.getPodMetric(pod, 'cpu'),
  podMemory: (pod: PodKind): number => UIActions.getPodMetric(pod, 'memory'),
  podPhase,
  podReadiness: (pod: PodKind): number => podReadiness(pod).readyCount,
  podRestarts,
  pvStorage: (pv) => _.toInteger(convertToBaseValue(pv?.spec?.capacity?.storage)),
  pvcStorage: (pvc) => _.toInteger(convertToBaseValue(pvc?.status?.capacity?.storage)),
  string: (val) => JSON.stringify(val),
  number: (val) => _.toNumber(val),
  getClusterOperatorStatus: (operator: ClusterOperator) => getClusterOperatorStatus(operator),
  getClusterOperatorVersion: (operator: ClusterOperator) => getClusterOperatorVersion(operator),
  getTemplateInstanceStatus,
  machinePhase: (machine: MachineKind): string => getMachinePhase(machine),
  pvcUsed: (pvc: K8sResourceKind): number => pvcUsed(pvc),
  volumeSnapshotSize: (snapshot: VolumeSnapshotKind): number => snapshotSize(snapshot),
  volumeSnapshotSource: (snapshot: VolumeSnapshotKind): string => snapshotSource(snapshot),
  snapshotLastRestore: (snapshot: K8sResourceKind, { restores }) =>
    restores[getName(snapshot)]?.status?.restoreTime,
  sortPackageManifestByDefaultChannelName: (packageManifest: PackageManifestKind): string => {
    const channel = defaultChannelFor(packageManifest);
    return channel?.currentCSVDesc?.displayName;
  },
};

// Common table row/columns helper SFCs for implementing accessible data grid
export const TableRow: React.FC<TableRowProps> = ({
  id,
  index,
  trKey,
  style,
  className,
  ...props
}) => {
  return (
    <Tr
      {...props}
      data-id={id}
      data-index={index}
      data-test-rows="resource-row"
      data-key={trKey}
      style={style}
      className={classNames('pf-v5-c-table__tr', className)}
      role="row"
    />
  );
};
TableRow.displayName = 'TableRow';

export type TableRowProps = {
  id: React.ReactText;
  index: number;
  title?: string;
  trKey: string;
  style: object;
  className?: string;
};

const BREAKPOINT_SM = 576;
const BREAKPOINT_MD = 768;
const BREAKPOINT_LG = 992;
const BREAKPOINT_XL = 1200;
const BREAKPOINT_XXL = 1400;
const MAX_COL_XS = 2;
const MAX_COL_SM = 4;
const MAX_COL_MD = 4;
const MAX_COL_LG = 6;
const MAX_COL_XL = 8;

const isColumnVisible = (
  widthInPixels: number,
  columnID: string,
  columns: Set<string> = new Set(),
  showNamespaceOverride,
) => {
  const showNamespace =
    columnID !== 'namespace' ||
    UIActions.getActiveNamespace() === ALL_NAMESPACES_KEY ||
    showNamespaceOverride;
  if (_.isEmpty(columns) && showNamespace) {
    return true;
  }
  if (!columns.has(columnID) || !showNamespace) {
    return false;
  }
  const columnIndex = [...columns].indexOf(columnID);
  if (widthInPixels < BREAKPOINT_SM) {
    return columnIndex < MAX_COL_XS;
  }
  if (widthInPixels < BREAKPOINT_MD) {
    return columnIndex < MAX_COL_SM;
  }
  if (widthInPixels < BREAKPOINT_LG) {
    return columnIndex < MAX_COL_MD;
  }
  if (widthInPixels < BREAKPOINT_XL) {
    return columnIndex < MAX_COL_LG;
  }
  if (widthInPixels < BREAKPOINT_XXL) {
    return columnIndex < MAX_COL_XL;
  }
  return true;
};

export const TableData: React.FC<TableDataProps> = ({
  className,
  columnID,
  columns,
  showNamespaceOverride,
  children,
}) => {
  return isColumnVisible(window.innerWidth, columnID, columns, showNamespaceOverride) ? (
    <Td data-label={columnID} className={className} role="gridcell">
      {children}
    </Td>
  ) : null;
};
TableData.displayName = 'TableData';
export type TableDataProps = {
  className?: string;
  columnID?: string;
  columns?: Set<string>;
  id?: string;
  showNamespaceOverride?: boolean;
};

const RowMemo = React.memo<RowFunctionArgs & { Row: React.FC<RowFunctionArgs> }>(
  ({ Row, ...props }) => <Row {...props} />,
);

const VirtualBody: React.FC<VirtualBodyProps> = (props) => {
  const {
    customData,
    Row,
    height,
    isScrolling,
    onChildScroll,
    data,
    columns,
    scrollTop,
    width,
    getRowProps,
    onRowsRendered,
  } = props;

  const cellMeasurementCache = new CellMeasurerCache({
    fixedWidth: true,
    minHeight: 44,
    keyMapper: (rowIndex) => _.get(props.data[rowIndex], 'metadata.uid', rowIndex),
  });

  const rowRenderer = ({ index, isVisible, key, style, parent }) => {
    const rowArgs = {
      obj: data[index],
      columns,
      customData,
    };

    // do not render non visible elements (this excludes overscan)
    if (!isVisible) {
      return null;
    }

    const rowProps = getRowProps?.(rowArgs.obj);
    const rowId = rowProps?.id ?? key;
    return (
      <CellMeasurer
        cache={cellMeasurementCache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}
      >
        <TableRow {...rowProps} id={rowId} index={index} trKey={key} style={style}>
          <RowMemo Row={Row} {...rowArgs} />
        </TableRow>
      </CellMeasurer>
    );
  };

  return (
    <VirtualTableBody
      autoHeight
      className="pf-v5-c-table pf-m-compact pf-m-border-rows pf-v5-c-window-scroller"
      deferredMeasurementCache={cellMeasurementCache}
      rowHeight={cellMeasurementCache.rowHeight}
      height={height || 0}
      isScrolling={isScrolling}
      onScroll={onChildScroll}
      overscanRowCount={10}
      columns={columns}
      rows={data}
      rowCount={data.length}
      rowRenderer={rowRenderer}
      scrollTop={scrollTop}
      width={width}
      onRowsRendered={onRowsRendered}
    />
  );
};

export type RowFunctionArgs<T = any, C = any> = {
  obj: T;
  columns: any[];
  customData?: C;
};

export type VirtualBodyProps = {
  customData?: any;
  Row: React.FC<RowFunctionArgs>;
  height: number;
  isScrolling: boolean;
  onChildScroll: (params: Scroll) => void;
  data: any[];
  columns: any[];
  scrollTop: number;
  width: number;
  expand: boolean;
  getRowProps?: (obj: any) => Partial<Pick<TableRowProps, 'id' | 'className' | 'title'>>;
  onRowsRendered?: (params: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    startIndex: number;
    stopIndex: number;
  }) => void;
};

type HeaderFunc = (componentProps: ComponentProps) => TableColumn[];

const getActiveColumns = (
  windowWidth: number,
  Header: HeaderFunc,
  componentProps: ComponentProps,
  activeColumns: Set<string>,
  columnManagementID: string,
  showNamespaceOverride: boolean,
): TableColumn[] => {
  let columns = Header(componentProps);
  if (_.isEmpty(activeColumns)) {
    activeColumns = new Set(
      columns.map((col) => {
        if (col.id && !col.additional) {
          return col.id;
        }
      }),
    );
  }
  if (columnManagementID) {
    columns = columns?.filter(
      (col) =>
        isColumnVisible(windowWidth, col.id, activeColumns, showNamespaceOverride) ||
        col.title === '',
    );
  } else {
    columns = columns?.filter((col) => activeColumns.has(col.id) || col.title === '');
  }

  const showNamespace =
    UIActions.getActiveNamespace() === ALL_NAMESPACES_KEY || showNamespaceOverride;
  if (!showNamespace) {
    columns = columns.filter((column) => column.id !== 'namespace');
  }
  return columns;
};

// TODO Replace with ./Table/VirtualizedTable
const VirtualizedTable: React.FCC<VirtualizedTableProps> = ({
  ariaLabel,
  columns,
  customData,
  data,
  expand,
  getRowProps,
  gridBreakPoint,
  onRowsRendered,
  onSelect,
  onSort,
  Row,
  scrollElement,
  sortBy,
}) => {
  const scrollNode = typeof scrollElement === 'function' ? scrollElement() : scrollElement;
  return (
    <div className="co-virtualized-table">
      <PfTable gridBreakPoint={gridBreakPoint} aria-label={ariaLabel}>
        <TableHeader onSort={onSort} sortBy={sortBy} columns={columns} onSelect={onSelect} />
      </PfTable>
      <WithScrollContainer>
        {(scrollContainer) => (
          <WindowScroller scrollElement={scrollNode ?? scrollContainer}>
            {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
              <AutoSizer disableHeight>
                {({ width }) => (
                  <div ref={registerChild}>
                    <VirtualBody
                      Row={Row}
                      customData={customData}
                      height={height}
                      isScrolling={isScrolling}
                      onChildScroll={onChildScroll}
                      data={data}
                      columns={columns}
                      scrollTop={scrollTop}
                      width={width}
                      expand={expand}
                      getRowProps={getRowProps}
                      onRowsRendered={onRowsRendered}
                    />
                  </div>
                )}
              </AutoSizer>
            )}
          </WindowScroller>
        )}
      </WithScrollContainer>
    </div>
  );
};

const StandardTable: React.FCC<StandardTableProps> = ({
  columns,
  customData,
  data,
  filters,
  gridBreakPoint,
  kindObj,
  onSelect,
  onSort,
  Rows,
  selected,
  selectedResourcesForKind,
  sortBy,
}) => {
  const rows = React.useMemo<IRow[]>(
    () =>
      Rows({
        componentProps: { data, filters, selected, kindObj },
        customData,
        selectedResourcesForKind,
      }),
    [Rows, data, filters, selected, kindObj, customData, selectedResourcesForKind],
  );
  return (
    <PfTable gridBreakPoint={gridBreakPoint}>
      <TableHeader onSort={onSort} sortBy={sortBy} columns={columns} onSelect={onSelect} />
      <Tbody>
        {rows.map((row, rowIndex) => {
          return (
            <Tr key={`row-${rowIndex}`}>
              {onSelect && (
                <Td
                  select={{
                    rowIndex,
                    onSelect,
                    isSelected: row.selected ?? false,
                    isDisabled: row.disableSelection ?? false,
                  }}
                />
              )}
              {(Array.isArray(row) ? row : row.cells).map(({ props, title }, colIndex) => (
                <Td key={`col-${colIndex}`} {...(props ?? {})}>
                  {title}
                </Td>
              ))}
            </Tr>
          );
        })}
      </Tbody>
    </PfTable>
  );
};

export const Table: React.FC<TableProps> = ({
  onSelect,
  filters: initFilters,
  selected,
  kindObj,
  Header: initHeader,
  activeColumns,
  columnManagementID,
  showNamespaceOverride,
  scrollElement,
  Row,
  Rows,
  expand,
  label,
  mock,
  selectedResourcesForKind,
  'aria-label': ariaLabel,
  virtualize = true,
  customData,
  gridBreakPoint = TableGridBreakpoint.none,
  loaded,
  loadError,
  NoDataEmptyMsg,
  EmptyMsg,
  defaultSortOrder,
  customSorts,
  data: unfilteredData,
  defaultSortFunc,
  reduxID,
  reduxIDs,
  staticFilters,
  rowFilters,
  isPinned,
  defaultSortField,
  getRowProps,
  onRowsRendered,
  'data-test': dataTest,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const filters = useDeepCompareMemoize(initFilters);
  const Header = useDeepCompareMemoize(initHeader);
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [sortBy, setSortBy] = React.useState({});
  const columnShift = onSelect ? 1 : 0; //shift indexes by 1 if select provided

  const { currentSortField, currentSortFunc, currentSortOrder, data, listId } = useTableData({
    reduxID,
    reduxIDs,
    defaultSortFunc,
    defaultSortField,
    defaultSortOrder,
    staticFilters,
    filters,
    rowFilters: rowFilters as RowFilterExt[],
    propData: unfilteredData,
    loaded,
    isPinned,
    customData,
    customSorts,
    sorts,
  });

  const columns = React.useMemo(
    () =>
      getActiveColumns(
        windowWidth,
        Header,
        { data, filters, selected, kindObj },
        activeColumns,
        columnManagementID,
        showNamespaceOverride,
      ),
    [
      windowWidth,
      Header,
      data,
      filters,
      selected,
      kindObj,
      activeColumns,
      columnManagementID,
      showNamespaceOverride,
    ],
  );

  const applySort = React.useCallback(
    (sortField, sortFunc, direction, columnTitle) => {
      dispatch(UIActions.sortList(listId, sortField, sortFunc || currentSortFunc, direction));
      const url = new URL(window.location.href);
      const sp = new URLSearchParams(window.location.search);
      sp.set('orderBy', direction);
      sp.set('sortBy', columnTitle);
      navigate(`${url.pathname}?${sp.toString()}${url.hash}`, { replace: true });
    },
    [currentSortFunc, dispatch, listId, navigate],
  );

  const onSort = React.useCallback(
    (event, index, direction) => {
      event.preventDefault();
      const sortColumn = columns[index - columnShift];
      applySort(sortColumn.sortField, sortColumn.sortFunc, direction, sortColumn.title);
      setSortBy({
        index,
        direction,
      });
    },
    [applySort, columnShift, columns],
  );

  React.useEffect(() => {
    setSortBy((currentSortBy) => {
      if (!currentSortBy) {
        if (currentSortField && currentSortOrder) {
          const columnIndex = _.findIndex(columns, { sortField: currentSortField });
          if (columnIndex > -1) {
            return { index: columnIndex + columnShift, direction: currentSortOrder };
          }
        }
        if (currentSortFunc && currentSortOrder) {
          const columnIndex = _.findIndex(columns, { sortFunc: currentSortFunc });
          if (columnIndex > -1) {
            return { index: columnIndex + columnShift, direction: currentSortOrder };
          }
        }
      }
      return currentSortBy;
    });
  }, [columnShift, columns, currentSortField, currentSortFunc, currentSortOrder, sortBy]);

  React.useEffect(() => {
    const handleResize = _.debounce(() => setWindowWidth(window.innerWidth), 100);
    const sp = new URLSearchParams(window.location.search);
    const columnIndex = _.findIndex(columns, { title: sp.get('sortBy') });

    if (columnIndex > -1) {
      const sortOrder = sp.get('orderBy') || SortByDirection.asc;
      const column = columns[columnIndex];
      applySort(column.sortField, column.sortFunc, sortOrder, column.title);
      setSortBy({
        index: columnIndex + columnShift,
        direction: sortOrder,
      });
    }

    // re-render after resize
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-test={dataTest} className="co-m-table-grid co-m-table-grid--bordered">
      {mock ? (
        <EmptyBox label={label} />
      ) : (
        <StatusBox
          skeleton={<div className="loading-skeleton--table" />}
          data={data}
          loaded={loaded}
          loadError={loadError}
          unfilteredData={unfilteredData}
          label={label}
          NoDataEmptyMsg={NoDataEmptyMsg}
          EmptyMsg={EmptyMsg}
        >
          {virtualize ? (
            <VirtualizedTable
              Row={Row}
              ariaLabel={ariaLabel}
              columns={columns}
              customData={customData}
              data={data}
              expand={expand}
              getRowProps={getRowProps}
              gridBreakPoint={gridBreakPoint}
              onRowsRendered={onRowsRendered}
              onSelect={onSelect}
              onSort={onSort}
              scrollElement={scrollElement}
              sortBy={sortBy}
            />
          ) : (
            <StandardTable
              Rows={Rows}
              columns={columns}
              data={data}
              filters={filters}
              selected={selected}
              kindObj={kindObj}
              customData={customData}
              gridBreakPoint={gridBreakPoint}
              onSelect={onSelect}
              onSort={onSort}
              selectedResourcesForKind={selectedResourcesForKind}
              sortBy={sortBy}
            />
          )}
        </StatusBox>
      )}
    </div>
  );
};

export type Filter = { key: string; value: string };

type RowsArgs = {
  componentProps: ComponentProps;
  selectedResourcesForKind: string[];
  customData: any;
};

export type TableColumn = {
  title: string;
  id?: string;
  additional?: boolean;
  sortFunc?: string;
  sortField?: string;
  props?: any;
};

export type TableProps = Partial<ComponentProps> & {
  customData?: any;
  customSorts?: { [key: string]: (obj: any) => number | string };
  defaultSortFunc?: string;
  defaultSortField?: string;
  defaultSortOrder?: SortByDirection;
  showNamespaceOverride?: boolean;
  Header: HeaderFunc;
  loadError?: string | Object;
  Row?: React.FC<RowFunctionArgs>;
  Rows?: (args: RowsArgs) => IRow[];
  'aria-label': string;
  onSelect?: OnSelect;
  virtualize?: boolean;
  NoDataEmptyMsg?: React.ComponentType<{}>;
  EmptyMsg?: React.ComponentType<{}>;
  loaded?: boolean;
  reduxID?: string;
  reduxIDs?: string[];
  rowFilters?: RowFilter[];
  label?: string;
  columnManagementID?: string;
  isPinned?: (val: any) => boolean;
  staticFilters?: Filter[];
  filters?: Filter[];
  activeColumns?: Set<string>;
  gridBreakPoint?: TableGridBreakpoint;
  selectedResourcesForKind?: string[];
  mock?: boolean;
  expand?: boolean;
  scrollElement?: HTMLElement | (() => HTMLElement);
  getRowProps?: VirtualBodyProps['getRowProps'];
  onRowsRendered?: VirtualBodyProps['onRowsRendered'];
  'data-test'?: string;
};

type VirtualizedTableProps = Partial<ComponentProps> & {
  ariaLabel?: TableProps['aria-label'];
  columns: TableColumn[];
  customData?: TableProps['customData'];
  expand?: boolean;
  getRowProps?: TableProps['getRowProps'];
  gridBreakPoint?: TableProps['gridBreakPoint'];
  onRowsRendered?: VirtualBodyProps['onRowsRendered'];
  onSelect?: TableProps['onSelect'];
  onSort?: OnSort;
  Row: TableProps['Row'];
  scrollElement?: TableProps['scrollElement'];
  sortBy: ISortBy;
};

type StandardTableProps = Partial<ComponentProps> & {
  columns: TableColumn[];
  customData?: TableProps['customData'];
  gridBreakPoint?: TableProps['gridBreakPoint'];
  onSelect: TableProps['onSelect'];
  onSort: OnSort;
  Rows?: TableProps['Rows'];
  selectedResourcesForKind?: TableProps['selectedResourcesForKind'];
  sortBy?: ISortBy;
};

export type ComponentProps = {
  data: any[];
  filters: Filter[];
  selected: boolean;
  kindObj: K8sResourceKindReference;
};
