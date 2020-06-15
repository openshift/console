import * as React from 'react';
import { WindowScroller, AutoSizer, Size } from 'react-virtualized';
import { Item, GroupedItems, GridChildrenProps, RenderHeader, RenderCell } from './types';
import GroupByFilterGrid from './GroupByFilterGrid';
import Grid from './Grid';
import Cell from './Cell';
import './VirtualizedGrid.scss';

type VirtualizedGridProps = {
  items: Item[] | GroupedItems;
  scrollElement?: Element;
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
};

const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({
  items,
  scrollElement,
  renderCell,
  isItemsGrouped = false,
  renderHeader,
}) => {
  return (
    <WindowScroller scrollElement={scrollElement ?? window}>
      {(props) => (
        <AutoSizer disableHeight>
          {({ width }: Size) =>
            isItemsGrouped ? (
              <GroupByFilterGrid {...props} width={width} items={items as GroupedItems}>
                {(gridProps: GridChildrenProps) => (
                  <Cell {...gridProps} renderHeader={renderHeader} renderCell={renderCell} />
                )}
              </GroupByFilterGrid>
            ) : (
              <Grid {...props} width={width} items={items as Item[]}>
                {(gridProps: GridChildrenProps) => <Cell {...gridProps} renderCell={renderCell} />}
              </Grid>
            )
          }
        </AutoSizer>
      )}
    </WindowScroller>
  );
};

export default VirtualizedGrid;
