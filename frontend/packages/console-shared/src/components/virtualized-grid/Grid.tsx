import * as React from 'react';
import { Grid as GridComponent, GridCellProps } from 'react-virtualized';
import { CELL_PADDING } from './const';
import { Item, GridChildrenProps } from './types';
import { CellMeasurementContext } from './utils';
import './Grid.scss';

type GridProps = {
  height: number;
  width: number;
  scrollTop: number;
  items: Item[];
  children: (props: GridChildrenProps) => React.ReactNode;
};

const Grid: React.FC<GridProps> = ({ height, width, scrollTop, items, children }) => {
  const { cache, cellWidth, cellMargin, overscanRowCount } = React.useContext(
    CellMeasurementContext,
  );
  const itemCount = items.length;
  const idealItemWidth = cellWidth + cellMargin;
  const columnCountEstimate = Math.max(1, Math.floor(width / idealItemWidth));
  const rowCount = Math.ceil(itemCount / columnCountEstimate);
  const columnCount = Math.max(1, itemCount && Math.ceil(itemCount / rowCount));
  const cellRenderer = (data: GridCellProps) => children({ data, columnCount, items });
  return (
    <GridComponent
      className="ocs-grid"
      autoHeight
      height={height ?? 0}
      width={width}
      scrollTop={scrollTop}
      rowHeight={(params) => cache.rowHeight(params) + CELL_PADDING}
      deferredMeasurementCache={cache}
      columnWidth={idealItemWidth}
      rowCount={rowCount}
      columnCount={columnCount}
      cellRenderer={cellRenderer}
      overscanRowCount={overscanRowCount}
    />
  );
};

export default Grid;
