import * as React from 'react';
import { CellMeasurerCache, Grid as GridComponent, GridCellProps } from 'react-virtualized';
import { IDEAL_CELL_WIDTH, IDEAL_SPACE_BW_TILES, OVERSCAN_ROW_COUNT, CELL_PADDING } from './const';
import { Item, GridChildrenProps } from './types';
import './Grid.scss';

type GridProps = {
  height: number;
  width: number;
  scrollTop: number;
  registerChild: any;
  items: Item[];
  children: (props: GridChildrenProps) => React.ReactNode;
};

const Grid: React.FC<GridProps> = ({
  height,
  width,
  scrollTop,
  registerChild,
  items,
  children,
}) => {
  const itemCount = items.length;
  const idealItemWidth = IDEAL_CELL_WIDTH + IDEAL_SPACE_BW_TILES;
  const cache: CellMeasurerCache = new CellMeasurerCache({
    defaultHeight: 250,
    minHeight: 200,
    fixedWidth: true,
  });
  const columnCountEstimate = Math.max(1, Math.floor(width / idealItemWidth));
  const rowCount = Math.ceil(itemCount / columnCountEstimate);
  const columnCount = Math.max(1, itemCount && Math.ceil(itemCount / rowCount));
  const cellRenderer = (data: GridCellProps) => children({ data, cache, columnCount, items });
  return (
    <GridComponent
      className="ocs-grid"
      autoHeight
      ref={registerChild}
      height={height ?? 0}
      width={width}
      scrollTop={scrollTop - cache.rowHeight({ index: 0 })}
      rowHeight={(params) => cache.rowHeight(params) + CELL_PADDING}
      deferredMeasurementCache={cache}
      columnWidth={idealItemWidth}
      rowCount={rowCount}
      columnCount={columnCount}
      cellRenderer={cellRenderer}
      overscanRowCount={OVERSCAN_ROW_COUNT}
    />
  );
};

export default Grid;
