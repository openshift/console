import * as React from 'react';
import classNames from 'classnames';
import { Grid as GridComponent, GridCellProps } from 'react-virtualized';
import { Params, GroupedItems, GridChildrenProps } from './types';
import { getItemsAndRowCount, CellMeasurementContext } from './utils';
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
  const {
    cache,
    cellWidth,
    cellMargin,
    className,
    overscanRowCount,
    headerHeight,
    estimatedCellHeight,
  } = React.useContext(CellMeasurementContext);
  const idealItemWidth = cellWidth + cellMargin;
  const columnCountEstimate = Math.max(1, Math.floor(width / idealItemWidth));
  const { items, rowCount, columnCount, headerRows } = getItemsAndRowCount(
    groupedItems,
    columnCountEstimate,
  );
  const cellRenderer = (data: GridCellProps) => children({ data, columnCount, items, rowCount });
  const getRowHeight = React.useCallback(
    ({ index }: Params): number => {
      if (headerRows.includes(index)) {
        return headerHeight;
      }
      return cache.rowHeight({ index });
    },
    [cache, headerHeight, headerRows],
  );
  return (
    <GridComponent
      autoHeight
      className={classNames('ocs-grid', className)}
      tabIndex={null}
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
      estimatedRowSize={estimatedCellHeight}
    />
  );
};

export default GroupByFilterGrid;
