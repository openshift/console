import * as React from 'react';
import * as _ from 'lodash';
import {
  Table as PfTable,
  TableHeader,
  TableGridBreakpoint,
  OnSelect,
  SortByDirection,
  ICell,
} from '@patternfly/react-table';
import { AutoSizer, WindowScroller } from '@patternfly/react-virtualized-extension';
import { ALL_NAMESPACES_KEY, useActiveNamespace } from '@console/shared';

import VirtualizedTableBody from './VirtualizedTableBody';
import { history, StatusBox, WithScrollContainer } from '../../utils';
import { sortResourceByValue } from './sort';

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
  showNamespaceOverride: boolean,
  namespace: string,
) => {
  const showNamespace = columnID !== 'namespace' || !namespace || showNamespaceOverride;
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

const getActiveColumns = <D extends any>(
  windowWidth: number,
  allColumns: TableColumn<D>[],
  activeColumns: Set<string>,
  columnManagementID: string,
  showNamespaceOverride: boolean,
  namespace: string,
) => {
  let columns = [...allColumns];
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
        isColumnVisible(windowWidth, col.id, activeColumns, showNamespaceOverride, namespace) ||
        col.title === '',
    );
  } else {
    columns = columns?.filter((col) => activeColumns.has(col.id) || col.title === '');
  }

  const showNamespace = !namespace || showNamespaceOverride;
  if (!showNamespace) {
    columns = columns.filter((column) => column.id !== 'namespace');
  }
  return columns;
};

export type TableColumn<D> = ICell & {
  title: string;
  id?: string;
  additional?: boolean;
  sort?: ((data: D[], sortDirection: SortByDirection) => D[]) | string;
};

export type RowProps<D, R extends any = {}> = {
  obj: D;
  rowData: R;
};

type VirtualizedTableProps<D, R extends any = {}> = {
  data: D[];
  unfilteredData: D[];
  loaded: boolean;
  loadError: any;
  columns: TableColumn<D>[];
  Row: React.ComponentType<RowProps<D, R>>;
  NoDataEmptyMsg?: React.ComponentType<{}>;
  EmptyMsg?: React.ComponentType<{}>;
  scrollNode?: () => HTMLElement;
  onSelect?: OnSelect;
  label?: string;
  'aria-label'?: string;
  gridBreakPoint?: TableGridBreakpoint;
  activeColumns?: Set<string>;
  columnManagementID?: string;
  showNamespaceOverride?: boolean;
  rowData?: R;
};

const VirtualizedTable = <D, R extends any = {}>({
  data,
  loaded,
  loadError,
  columns: allColumns,
  NoDataEmptyMsg,
  EmptyMsg,
  scrollNode,
  label,
  'aria-label': ariaLabel,
  gridBreakPoint = TableGridBreakpoint.none,
  onSelect,
  Row,
  activeColumns,
  columnManagementID,
  showNamespaceOverride,
  rowData,
  unfilteredData,
}: VirtualizedTableProps<D, R>) => {
  const columnShift = onSelect ? 1 : 0; //shift indexes by 1 if select provided
  const [sortBy, setSortBy] = React.useState<{
    index: number;
    direction: SortByDirection;
  }>({ index: columnShift, direction: SortByDirection.asc });

  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [namespace] = useActiveNamespace();

  const columns = React.useMemo(
    () =>
      getActiveColumns(
        windowWidth,
        allColumns,
        activeColumns,
        columnManagementID,
        showNamespaceOverride,
        namespace === ALL_NAMESPACES_KEY ? undefined : namespace,
      ),
    [windowWidth, allColumns, activeColumns, columnManagementID, showNamespaceOverride, namespace],
  );

  const applySort = React.useCallback(
    (index, direction) => {
      const url = new URL(window.location.href);
      const sp = new URLSearchParams(window.location.search);

      const sortColumn = columns[index - columnShift];
      if (sortColumn) {
        sp.set('orderBy', direction);
        sp.set('sortBy', sortColumn.title);
        history.replace(`${url.pathname}?${sp.toString()}${url.hash}`);
        setSortBy({
          index,
          direction,
        });
      }
    },
    [columnShift, columns],
  );

  data = React.useMemo(() => {
    const sortColumn = columns[sortBy.index - columnShift];
    if (!sortColumn.sort) {
      return data;
    } else if (typeof sortColumn.sort === 'string') {
      return data.sort(
        sortResourceByValue(sortBy.direction, (obj) => _.get(obj, sortColumn.sort as string, '')),
      );
    }
    return sortColumn.sort(data, sortBy.direction);
  }, [columnShift, columns, data, sortBy.direction, sortBy.index]);

  React.useEffect(() => {
    const handleResize = _.debounce(() => setWindowWidth(window.innerWidth), 100);

    const sp = new URLSearchParams(window.location.search);
    const columnIndex = _.findIndex(columns, { title: sp.get('sortBy') });

    if (columnIndex > -1) {
      const sortOrder =
        sp.get('orderBy') === SortByDirection.desc.valueOf()
          ? SortByDirection.desc
          : SortByDirection.asc;
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

  const onSort = React.useCallback(
    (event, index, direction) => {
      event.preventDefault();
      applySort(index, direction);
    },
    [applySort],
  );

  const renderVirtualizedTable = (scrollContainer) => (
    <WindowScroller scrollElement={scrollContainer}>
      {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
        <AutoSizer disableHeight>
          {({ width }) => (
            <div ref={registerChild}>
              <VirtualizedTableBody<D, R>
                Row={Row}
                height={height}
                isScrolling={isScrolling}
                onChildScroll={onChildScroll}
                data={data}
                columns={columns}
                scrollTop={scrollTop}
                width={width}
                rowData={rowData}
              />
            </div>
          )}
        </AutoSizer>
      )}
    </WindowScroller>
  );

  return (
    <div className="co-m-table-grid co-m-table-grid--bordered">
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
        <div role="grid" aria-label={ariaLabel} aria-rowcount={data?.length}>
          <PfTable
            cells={columns}
            rows={[]}
            gridBreakPoint={gridBreakPoint}
            onSort={onSort}
            onSelect={onSelect}
            sortBy={sortBy}
            className="pf-m-compact pf-m-border-rows"
            role="presentation"
          >
            <TableHeader />
          </PfTable>
          {scrollNode ? (
            renderVirtualizedTable(scrollNode)
          ) : (
            <WithScrollContainer>{renderVirtualizedTable}</WithScrollContainer>
          )}
        </div>
      </StatusBox>
    </div>
  );
};

export default VirtualizedTable;
