import * as React from 'react';
import { WindowScroller, AutoSizer, Size, CellMeasurerCache } from 'react-virtualized';
import { Item, GroupedItems, GridChildrenProps, RenderHeader, RenderCell } from './types';
import GroupByFilterGrid from './GroupByFilterGrid';
import Grid from './Grid';
import Cell from './Cell';
import { WithScrollContainer } from '@console/internal/components/utils';
import {
  IDEAL_SPACE_BW_TILES,
  IDEAL_CELL_WIDTH,
  DEFAULT_CELL_HEIGHT,
  OVERSCAN_ROW_COUNT,
  HEADER_FIXED_HEIGHT,
  ESTIMATED_ROW_SIZE,
} from './const';
import { CellMeasurementContext } from './utils';

type VirtualizedGridProps = {
  items: Item[] | GroupedItems;
  renderCell: RenderCell;
  /**
   * should be set when items are grouped/ `isItemGrouped` is set to true and each group has a heading
   */
  renderHeader?: RenderHeader;
  /**
   * Default value: false
   * should be set true when items are grouped
   */
  isItemsGrouped?: boolean;

  /** Grid styles */
  className?: string;

  /** Cell Measurements */
  cellWidth?: number;
  cellMargin?: number;
  celldefaultHeight?: number;
  estimatedCellHeight?: number;

  overscanRowCount?: number;
  headerHeight?: number;
};

const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  items,
  className,
  isItemsGrouped = false,
  cellMargin = IDEAL_SPACE_BW_TILES,
  cellWidth = IDEAL_CELL_WIDTH,
  celldefaultHeight = DEFAULT_CELL_HEIGHT,
  overscanRowCount = OVERSCAN_ROW_COUNT,
  headerHeight = HEADER_FIXED_HEIGHT,
  estimatedCellHeight = ESTIMATED_ROW_SIZE,
  renderCell,
  renderHeader,
}) => {
  const cache: CellMeasurerCache = new CellMeasurerCache({
    defaultHeight: celldefaultHeight,
    minHeight: 200,
    fixedWidth: true,
  });
  return (
    <CellMeasurementContext.Provider
      value={{
        cache,
        cellMargin,
        cellWidth,
        overscanRowCount,
        headerHeight,
        estimatedCellHeight,
        className,
      }}
    >
      <WithScrollContainer>
        {(scrollElement) => (
          <WindowScroller scrollElement={scrollElement ?? window}>
            {({ registerChild, ...props }) => (
              <AutoSizer disableHeight>
                {({ width }: Size) => (
                  <div ref={registerChild}>
                    {isItemsGrouped ? (
                      <GroupByFilterGrid {...props} width={width} items={items as GroupedItems}>
                        {(gridProps: GridChildrenProps) => {
                          const {
                            data: { key, style },
                          } = gridProps;
                          return (
                            <Cell
                              {...gridProps}
                              key={key}
                              style={style}
                              renderHeader={renderHeader}
                              renderCell={renderCell}
                            />
                          );
                        }}
                      </GroupByFilterGrid>
                    ) : (
                      <Grid {...props} width={width} items={items as Item[]}>
                        {(gridProps: GridChildrenProps) => {
                          const {
                            data: { key, style },
                          } = gridProps;
                          return (
                            <Cell {...gridProps} key={key} style={style} renderCell={renderCell} />
                          );
                        }}
                      </Grid>
                    )}
                  </div>
                )}
              </AutoSizer>
            )}
          </WindowScroller>
        )}
      </WithScrollContainer>
    </CellMeasurementContext.Provider>
  );
};

export default VirtualizedGrid;
