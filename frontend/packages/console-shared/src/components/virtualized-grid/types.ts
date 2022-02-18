import { GridCellProps } from 'react-virtualized';
import { VirtualizedGridItem } from '@console/dynamic-plugin-sdk/src/api/internal-types';

export {
  VirtualizedGridItem as Item,
  VirtualizedGridGroupedItems as GroupedItems,
  VirtualizedGridRenderHeader as RenderHeader,
  VirtualizedGridRenderCell as RenderCell,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';

export type Params = {
  index: number;
};

export type CellItem = string | null | VirtualizedGridItem;

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
