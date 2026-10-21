import type { FC, ReactNode } from 'react';
import { useContext } from 'react';
import { css } from '@patternfly/react-styles';
import type { GridCellProps } from 'react-virtualized';
import { Grid as GridComponent } from 'react-virtualized';
import type { Item, GridChildrenProps } from './types';
import { CellMeasurementContext } from './utils';
import './Grid.scss';

type GridProps = {
  height: number;
  width: number;
  scrollTop: number;
  items: Item[];
  children: (props: GridChildrenProps) => ReactNode;
};

const Grid: FC<GridProps> = ({ height, width, scrollTop, items, children }) => {
  const {
    cache,
    cellWidth,
    cellMargin,
    className,
    overscanRowCount,
    estimatedCellHeight,
  } = useContext(CellMeasurementContext);
  const itemCount = items.length;
  const idealItemWidth = cellWidth + cellMargin;
  const columnCount = Math.max(1, Math.floor(width / idealItemWidth));
  const rowCount = Math.ceil(itemCount / columnCount);
  const cellRenderer = (data: GridCellProps) => children({ data, columnCount, items, rowCount });
  return (
    <GridComponent
      containerRole="row"
      autoHeight
      className={css('ocs-grid', className)}
      tabIndex={null}
      height={height ?? 0}
      width={width}
      scrollTop={scrollTop}
      rowHeight={cache.rowHeight}
      deferredMeasurementCache={cache}
      columnWidth={idealItemWidth}
      rowCount={rowCount}
      columnCount={columnCount}
      cellRenderer={cellRenderer}
      overscanRowCount={overscanRowCount}
      estimatedRowSize={estimatedCellHeight}
    />
  );
};

export default Grid;
