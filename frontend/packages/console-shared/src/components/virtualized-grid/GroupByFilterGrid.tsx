import type { ReactNode, FC } from 'react';
import { useContext, useCallback } from 'react';
import { css } from '@patternfly/react-styles';
import type { GridCellProps } from 'react-virtualized';
import { Grid as GridComponent } from 'react-virtualized';
import type { Params, GroupedItems, GridChildrenProps } from './types';
import { getItemsAndRowCount, CellMeasurementContext } from './utils';
import './Grid.scss';

type GroupByFilterGridProps = {
  height: number;
  width: number;
  scrollTop: number;
  items: GroupedItems;
  children: (props: GridChildrenProps) => ReactNode;
};

const GroupByFilterGrid: FC<GroupByFilterGridProps> = ({
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
  } = useContext(CellMeasurementContext);
  const idealItemWidth = cellWidth + cellMargin;
  const columnCountEstimate = Math.max(1, Math.floor(width / idealItemWidth));
  const { items, rowCount, columnCount, headerRows } = getItemsAndRowCount(
    groupedItems,
    columnCountEstimate,
  );
  const cellRenderer = (data: GridCellProps) => children({ data, columnCount, items, rowCount });
  const getRowHeight = useCallback(
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
      className={css('ocs-grid', className)}
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
