import * as React from 'react';
import * as _ from 'lodash';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Button } from '@patternfly/react-core';
import {
  TableGridBreakpoint,
  SortByDirection,
  Table as PfTable,
  Td,
} from '@patternfly/react-table';
import { AutoSizer, WindowScroller } from '@patternfly/react-virtualized-extension';
import {
  TableColumn,
  TableDataProps,
  VirtualizedTableFC,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { StatusBox } from '@console/shared/src/components/status/StatusBox';
import { EmptyBox } from '@console/shared/src/components/empty-state/EmptyBox';
import VirtualizedTableBody from './VirtualizedTableBody';
import TableHeader from './TableHeader';
import { WithScrollContainer } from '../../utils/dom-utils';
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
    <Td data-label={id} className={className} role="gridcell">
      {children}
    </Td>
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
  allRowsSelected,
  canSelectAll = true,
  Row,
  rowData,
  unfilteredData,
  mock = false,
  sortColumnIndex,
  sortDirection,
  csvData,
  onRowsRendered,
}) => {
  const navigate = useNavigate();
  const columnShift = onSelect ? 1 : 0; //shift indexes by 1 if select provided
  const [sortBy, setSortBy] = React.useState<{
    index: number;
    direction: SortByDirection;
  }>({ index: sortColumnIndex || columnShift, direction: sortDirection || SortByDirection.asc });

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

  const sortedData = React.useMemo(() => {
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

  const downloadCsv = () => {
    // csvData should be formatted as comma-seperated values
    // (e.g. `"a","b","c", \n"d","e","f", \n"h","i","j"`)
    const blobCsvData = new Blob([csvData], { type: 'text/csv' });
    const csvURL = URL.createObjectURL(blobCsvData);
    const link = document.createElement('a');
    link.href = csvURL;
    link.download = `openshift.csv`;
    link.click();
  };

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
          <div className="co-virtualized-table" aria-label={ariaLabel}>
            {csvData && (
              <Button className="co-virtualized-table--export-csv-button" onClick={downloadCsv}>
                Export as CSV
              </Button>
            )}
            <PfTable gridBreakPoint={gridBreakPoint} className="pf-m-compact pf-m-border-rows">
              <TableHeader
                allRowsSelected={allRowsSelected}
                canSelectAll={canSelectAll}
                columns={columns}
                onSelect={onSelect}
                onSort={onSort}
                sortBy={sortBy}
              />
            </PfTable>
            <WithScrollContainer>
              {(scrollContainer) => (
                <WindowScroller scrollElement={scrollNode?.() ?? scrollContainer}>
                  {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
                    <AutoSizer disableHeight>
                      {({ width }) => (
                        <div ref={registerChild}>
                          <VirtualizedTableBody
                            columns={columns}
                            data={sortedData}
                            height={height}
                            isScrolling={isScrolling}
                            onChildScroll={onChildScroll}
                            onRowsRendered={onRowsRendered}
                            Row={Row}
                            rowData={rowData}
                            scrollTop={scrollTop}
                            width={width}
                            onSelect={onSelect}
                          />
                        </div>
                      )}
                    </AutoSizer>
                  )}
                </WindowScroller>
              )}
            </WithScrollContainer>
          </div>
        </StatusBox>
      )}
    </div>
  );
};

export default VirtualizedTable;
