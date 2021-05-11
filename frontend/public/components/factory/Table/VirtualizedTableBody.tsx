import * as React from 'react';
import { CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import { Scroll } from '@patternfly/react-virtualized-extension/dist/js/components/Virtualized/types';
import { TableColumn, RowProps } from './VirtualizedTable';
import { usePrevious } from '@console/shared/src/hooks/previous';
import { VirtualTableBody } from '@patternfly/react-virtualized-extension';

const overscanIndicesGetter = ({
  cellCount, // Number of rows or columns in the current axis
  overscanCellsCount, // Maximum number of cells to over-render in either direction
  startIndex, // Begin of range of visible cells
  stopIndex, // End of range of visible cells
}) => ({
  overscanStartIndex: Math.max(0, startIndex - overscanCellsCount),
  overscanStopIndex: Math.min(cellCount - 1, stopIndex + overscanCellsCount),
});

type VirtualizedTableBodyProps<D = any> = {
  Row: React.ComponentType<RowProps<D>>;
  data: D[];
  height: number;
  isScrolling: boolean;
  onChildScroll: (params: Scroll) => void;
  columns: TableColumn<D>[];
  scrollTop: number;
  width: number;
  sortBy: any;
};

const VirtualizedTableBody: React.FC<VirtualizedTableBodyProps> = ({
  Row,
  height,
  isScrolling,
  onChildScroll,
  data,
  columns,
  scrollTop,
  width,
  sortBy,
}) => {
  const prevWidth = usePrevious(width);
  const prevSortBy = usePrevious(sortBy);
  const cellMeasurementCache = React.useMemo(
    () =>
      new CellMeasurerCache({
        fixedWidth: true,
        minHeight: 44,
        keyMapper: (rowIndex) => data?.[rowIndex]?.metadata?.uid || rowIndex, // TODO custom keyMapper ?
      }),
    [data],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useMemo(() => cellMeasurementCache.clearAll(), [columns, width]);

  const rowRenderer = React.useCallback(
    ({ index, isScrolling: scrolling, isVisible, key, style, parent }) => {
      // do not render non visible elements (this excludes overscan)
      if (!isVisible) {
        return null;
      }

      const rowArgs: RowProps<any> = {
        obj: data[index],
        index,
        columns,
        isScrolling: scrolling,
        style,
      };

      return (
        <CellMeasurer
          cache={cellMeasurementCache}
          columnIndex={0}
          key={key}
          parent={parent}
          rowIndex={index}
        >
          <Row key={key} {...rowArgs} />
        </CellMeasurer>
      );
    },
    [cellMeasurementCache, columns, data],
  );

  return (
    <VirtualTableBody
      autoHeight
      className="pf-c-table pf-m-compact pf-m-border-rows pf-c-virtualized pf-c-window-scroller"
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
      isScrollingOptOut={width === prevWidth && sortBy === prevSortBy}
      overscanIndicesGetter={overscanIndicesGetter}
    />
  );
};

export default VirtualizedTableBody;
