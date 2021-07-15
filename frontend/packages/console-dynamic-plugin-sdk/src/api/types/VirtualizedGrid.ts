import { GridCellProps } from 'react-virtualized';

export type Params = {
  index: number;
};

export type Item = {
  [key: string]: any;
};

export type GroupedItems = {
  [key: string]: Item[];
};

export type CellItem = string | null | Item;

export type RenderHeader = (heading: string) => React.ReactNode;

export type RenderCell = (item: Item) => React.ReactNode;

export type GridChildrenProps = {
  data: GridCellProps;
  columnCount: number;
  items: CellItem[];
  rowCount: number;
};

export type CellSize = {
  height: string | number;
  width: string | number;
};

export type VirtualizedGridProps = {
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
