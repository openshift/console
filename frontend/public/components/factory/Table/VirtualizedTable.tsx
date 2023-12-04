import * as React from 'react';
import * as _ from 'lodash';
import { TableGridBreakpoint, SortByDirection } from '@patternfly/react-table';
import {
  Table as PfTable,
  TableHeader as TableHeaderDeprecated,
} from '@patternfly/react-table/deprecated';
import * as classNames from 'classnames';
import { AutoSizer, WindowScroller } from '@patternfly/react-virtualized-extension';
import { useNavigate } from 'react-router-dom-v5-compat';
import { VirtualizedTableFC, TableColumn, TableDataProps } from '@console/dynamic-plugin-sdk';

import VirtualizedTableBody from './VirtualizedTableBody';
import { StatusBox, WithScrollContainer, EmptyBox } from '../../utils';
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

const isColumnVisible = <D extends any>(
  widthInPixels: number,
  column: TableColumn<D>,
  columnIDs: string[],
): boolean => {
  if (column.id === '') {
    return true;
  }
  const columnIndex = columnIDs.indexOf(column.id);
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

export const TableData: React.FC<TableDataProps> = ({ className, id, activeColumnIDs, children }) =>
  (activeColumnIDs.has(id) || id === '') && (
    <td id={id} className={classNames('pf-v5-c-table__td', className)} role="gridcell">
      {children}
    </td>
  );
TableData.displayName = 'TableData';

const VirtualizedTable: VirtualizedTableFC = ({
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
  rowData,
  unfilteredData,
  mock = false,
}) => {
  const navigate = useNavigate();
  const columnShift = onSelect ? 1 : 0; //shift indexes by 1 if select provided
  const [sortBy, setSortBy] = React.useState<{
    index: number;
    direction: SortByDirection;
  }>({ index: columnShift, direction: SortByDirection.asc });

  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

  const columns = React.useMemo(() => {
    const colIDs = allColumns.map((c) => c.id);
    return allColumns.filter((col) => isColumnVisible(windowWidth, col, colIDs));
  }, [windowWidth, allColumns]);

  const applySort = React.useCallback(
    (index, direction) => {
      const url = new URL(window.location.href);
      const sp = new URLSearchParams(window.location.search);

      const sortColumn = columns[index - columnShift];
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
    [columnShift, columns, navigate],
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
              <VirtualizedTableBody
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
          <div
            className="co-virtualized-table"
            role="grid"
            aria-label={ariaLabel}
            aria-rowcount={data?.length}
          >
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
              <TableHeaderDeprecated />
            </PfTable>
            {scrollNode ? (
              renderVirtualizedTable(scrollNode)
            ) : (
              <WithScrollContainer>{renderVirtualizedTable}</WithScrollContainer>
            )}
          </div>
        </StatusBox>
      )}
    </div>
  );
};

export default VirtualizedTable;
