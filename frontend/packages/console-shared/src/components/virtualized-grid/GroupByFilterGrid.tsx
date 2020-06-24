import * as React from 'react';
import { CellMeasurerCache, Grid as GridComponent, GridCellProps } from 'react-virtualized';
import {
  IDEAL_CELL_WIDTH,
  IDEAL_SPACE_BW_TILES,
  HEADER_FIXED_HEIGHT,
  OVERSCAN_ROW_COUNT,
  CELL_PADDING,
} from './const';
import { getItemsAndRowCount } from './utils';
import { Params, GroupedItems, GridChildrenProps } from './types';
import './Grid.scss';

type GroupByFilterGridProps = {
  height: number;
  width: number;
  scrollTop: number;
  registerChild: any;
  items: GroupedItems;
  children: (props: GridChildrenProps) => React.ReactNode;
};

const GroupByFilterGrid: React.FC<GroupByFilterGridProps> = ({
  height,
  width,
  scrollTop,
  registerChild,
  items: groupedItems,
  children,
}) => {
  const idealItemWidth = IDEAL_CELL_WIDTH + IDEAL_SPACE_BW_TILES;
  const columnCountEstimate = Math.max(1, Math.floor(width / idealItemWidth));
  const { items, rowCount, columnCount, headerRows } = getItemsAndRowCount(
    groupedItems,
    columnCountEstimate,
  );
  const cache = new CellMeasurerCache({ defaultHeight: 250, minHeight: 200, fixedWidth: true });
  const cellRenderer = (data: GridCellProps) => children({ data, cache, columnCount, items });
  const getRowHeight = React.useCallback(
    ({ index }: Params): number => {
      if (headerRows.includes(index)) {
        return HEADER_FIXED_HEIGHT;
      }
      return cache.rowHeight({ index }) + CELL_PADDING;
    },
    [cache, headerRows],
  );
  return (
    <GridComponent
      className="ocs-grid"
      autoHeight
      ref={registerChild}
      height={height ?? 0}
      width={width}
      scrollTop={scrollTop}
      rowHeight={getRowHeight}
      deferredMeasurementCache={cache}
      columnWidth={idealItemWidth}
      rowCount={rowCount}
      columnCount={columnCount}
      cellRenderer={cellRenderer}
      overscanRowCount={OVERSCAN_ROW_COUNT}
    />
  );
};

export default GroupByFilterGrid;
