import * as React from 'react';
import { Grid as GridComponent, GridCellProps } from 'react-virtualized';
import { CELL_PADDING } from './const';
import { getItemsAndRowCount, CellMeasurementContext } from './utils';
import { Params, GroupedItems, GridChildrenProps } from './types';
import './Grid.scss';

type GroupByFilterGridProps = {
  height: number;
  width: number;
  scrollTop: number;
  items: GroupedItems;
  children: (props: GridChildrenProps) => React.ReactNode;
};

const GroupByFilterGrid: React.FC<GroupByFilterGridProps> = ({
  height,
  width,
  scrollTop,
  items: groupedItems,
  children,
}) => {
  const { cache, cellWidth, cellMargin, overscanRowCount, headerHeight } = React.useContext(
    CellMeasurementContext,
  );
  const idealItemWidth = cellWidth + cellMargin;
  const columnCountEstimate = Math.max(1, Math.floor(width / idealItemWidth));
  const { items, rowCount, columnCount, headerRows } = getItemsAndRowCount(
    groupedItems,
    columnCountEstimate,
  );
  const cellRenderer = (data: GridCellProps) => children({ data, columnCount, items });
  const getRowHeight = React.useCallback(
    ({ index }: Params): number => {
      if (headerRows.includes(index)) {
        return headerHeight;
      }
      return cache.rowHeight({ index }) + CELL_PADDING;
    },
    [cache, headerHeight, headerRows],
  );
  return (
    <GridComponent
      className="ocs-grid"
      autoHeight
      height={height ?? 0}
      width={width}
      scrollTop={scrollTop}
      rowHeight={getRowHeight}
      deferredMeasurementCache={cache}
      columnWidth={idealItemWidth}
      rowCount={rowCount}
      columnCount={columnCount}
      cellRenderer={cellRenderer}
      overscanRowCount={overscanRowCount}
    />
  );
};

export default GroupByFilterGrid;
