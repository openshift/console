import * as _ from 'lodash-es';
import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { TableGridBreakpoint, SortByDirection, OnSelect } from '@patternfly/react-table';
import {
  Table as PfTable,
  TableHeader as TableHeaderDeprecated,
  TableBody as TableBodyDeprecated,
  TableProps as PfTableProps,
} from '@patternfly/react-table/deprecated';
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
import { RowFilter as RowFilterExt } from '@console/dynamic-plugin-sdk';
import { RowFilter } from '../filter-toolbar';
import * as UIActions from '../../actions/ui';
import { alertingRuleStateOrder, alertSeverityOrder } from '../monitoring/utils';
import { ingressValidHosts } from '../ingress';
import { convertToBaseValue, EmptyBox, StatusBox, WithScrollContainer } from '../utils';
import {
  CustomResourceDefinitionKind,
  getClusterOperatorStatus,
  getClusterOperatorVersion,
  getJobTypeAndCompletions,
  getLatestVersionForCRD,
  getTemplateInstanceStatus,
  K8sResourceKind,
  K8sResourceKindReference,
  PodKind,
  podPhase,
  podReadiness,
  podRestarts,
  MachineKind,
  VolumeSnapshotKind,
  ClusterOperator,
} from '../../module/k8s';
import { useTableData } from './table-data-hook';

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
    <tr
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
  ...props
}) => {
  return isColumnVisible(window.innerWidth, columnID, columns, showNamespaceOverride) ? (
    <td {...props} className={classNames('pf-v5-c-table__td', className)} role="gridcell" />
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

const TableWrapper: React.FC<TableWrapperProps> = ({
  virtualize,
  ariaLabel,
  ariaRowCount,
  ...props
}) => {
  return virtualize ? (
    <div {...props} role="grid" aria-label={ariaLabel} aria-rowcount={ariaRowCount} />
  ) : (
    <React.Fragment {...props} />
  );
};
export type TableWrapperProps = {
  virtualize: boolean;
  ariaLabel: string;
  ariaRowCount: number;
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

export type VirtualBodyProps<D = any, C = any> = {
  customData?: C;
  Row: React.FC<RowFunctionArgs>;
  height: number;
  isScrolling: boolean;
  onChildScroll: (params: Scroll) => void;
  data: D[];
  columns: any[];
  scrollTop: number;
  width: number;
  expand: boolean;
  getRowProps?: (obj: D) => Partial<Pick<TableRowProps, 'id' | 'className' | 'title'>>;
  onRowsRendered?: (params: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    startIndex: number;
    stopIndex: number;
  }) => void;
};

type HeaderFunc = (componentProps: ComponentProps) => any[];

const getActiveColumns = (
  windowWidth: number,
  Header: HeaderFunc,
  componentProps: ComponentProps,
  activeColumns: Set<string>,
  columnManagementID: string,
  showNamespaceOverride: boolean,
) => {
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

const getComponentProps = (
  data: any[],
  filters: Filter[],
  selected: boolean,
  kindObj: K8sResourceKindReference,
): ComponentProps => ({
  data,
  filters,
  selected,
  kindObj,
});

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
  Rows,
  Row,
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
  data: propData,
  defaultSortFunc,
  reduxID,
  reduxIDs,
  staticFilters,
  rowFilters,
  isPinned,
  defaultSortField,
  getRowProps,
  onRowsRendered,
}) => {
  const filters = useDeepCompareMemoize(initFilters);
  const Header = useDeepCompareMemoize(initHeader);
  const { currentSortField, currentSortFunc, currentSortOrder, data, listId } = useTableData({
    reduxID,
    reduxIDs,
    defaultSortFunc,
    defaultSortField,
    defaultSortOrder,
    staticFilters,
    filters,
    rowFilters: rowFilters as RowFilterExt[],
    propData,
    loaded,
    isPinned,
    customData,
    customSorts,
    sorts,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [sortBy, setSortBy] = React.useState({});

  const [columns, componentProps] = React.useMemo(() => {
    const cProps = getComponentProps(data, filters, selected, kindObj);
    return [
      getActiveColumns(
        windowWidth,
        Header,
        cProps,
        activeColumns,
        columnManagementID,
        showNamespaceOverride,
      ),
      cProps,
    ];
  }, [
    windowWidth,
    Header,
    data,
    filters,
    selected,
    kindObj,
    activeColumns,
    columnManagementID,
    showNamespaceOverride,
  ]);

  const columnShift = onSelect ? 1 : 0; //shift indexes by 1 if select provided

  React.useEffect(() => {
    if (!sortBy) {
      let newSortBy = {};
      if (currentSortField && currentSortOrder) {
        const columnIndex = _.findIndex(columns, { sortField: currentSortField });
        if (columnIndex > -1) {
          newSortBy = { index: columnIndex + columnShift, direction: currentSortOrder };
        }
      } else if (currentSortFunc && currentSortOrder) {
        const columnIndex = _.findIndex(columns, { sortFunc: currentSortFunc });
        if (columnIndex > -1) {
          newSortBy = { index: columnIndex + columnShift, direction: currentSortOrder };
        }
      }
      setSortBy(newSortBy);
    }
  }, [columnShift, columns, currentSortField, currentSortFunc, currentSortOrder, sortBy]);

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

  const ariaRowCount = data && data.length;
  const scrollNode = typeof scrollElement === 'function' ? scrollElement() : scrollElement;
  const renderVirtualizedTable = (scrollContainer) => (
    <WindowScroller scrollElement={scrollContainer}>
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
  );
  const children = mock ? (
    <EmptyBox label={label} />
  ) : (
    <div className={classNames({ 'co-virtualized-table': virtualize })}>
      <TableWrapper virtualize={virtualize} ariaLabel={ariaLabel} ariaRowCount={ariaRowCount}>
        <PfTable
          cells={columns}
          rows={
            virtualize
              ? []
              : Rows({
                  componentProps,
                  selectedResourcesForKind,
                  customData,
                })
          }
          gridBreakPoint={gridBreakPoint}
          onSort={onSort}
          onSelect={onSelect}
          sortBy={sortBy}
          className="pf-m-compact pf-m-border-rows"
          role={virtualize ? 'presentation' : 'grid'}
          aria-label={virtualize ? null : ariaLabel}
        >
          <TableHeaderDeprecated role="rowgroup" />
          {!virtualize && <TableBodyDeprecated />}
        </PfTable>
        {virtualize &&
          (scrollNode ? (
            renderVirtualizedTable(scrollNode)
          ) : (
            <WithScrollContainer>{renderVirtualizedTable}</WithScrollContainer>
          ))}
      </TableWrapper>
    </div>
  );
  return (
    <div className="co-m-table-grid co-m-table-grid--bordered">
      {mock ? (
        children
      ) : (
        <StatusBox
          skeleton={<div className="loading-skeleton--table" />}
          data={data}
          loaded={loaded}
          loadError={loadError}
          unfilteredData={propData}
          label={label}
          NoDataEmptyMsg={NoDataEmptyMsg}
          EmptyMsg={EmptyMsg}
        >
          {children}
        </StatusBox>
      )}
    </div>
  );
};

export type Filter = { key: string; value: string };

type RowsArgs<C = any> = {
  componentProps: ComponentProps;
  selectedResourcesForKind: string[];
  customData: C;
};

export type TableProps<D = any, C = any> = Partial<ComponentProps<D>> & {
  customData?: C;
  customSorts?: { [key: string]: (obj: D) => number | string };
  defaultSortFunc?: string;
  defaultSortField?: string;
  defaultSortOrder?: SortByDirection;
  showNamespaceOverride?: boolean;
  Header: HeaderFunc;
  loadError?: string | Object;
  Row?: React.FC<RowFunctionArgs<D, C>>;
  Rows?: (args: RowsArgs<C>) => PfTableProps['rows'];
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
  isPinned?: (val: D) => boolean;
  staticFilters?: Filter[];
  activeColumns?: Set<string>;
  gridBreakPoint?: TableGridBreakpoint;
  selectedResourcesForKind?: string[];
  mock?: boolean;
  expand?: boolean;
  scrollElement?: HTMLElement | (() => HTMLElement);
  getRowProps?: VirtualBodyProps<D>['getRowProps'];
  onRowsRendered?: VirtualBodyProps<D>['onRowsRendered'];
};

export type ComponentProps<D = any> = {
  data: D[];
  filters: Filter[];
  selected: boolean;
  kindObj: K8sResourceKindReference;
};
