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
