import * as React from 'react';
import { CellMeasurer } from 'react-virtualized';
import { IDEAL_SPACE_BW_TILES } from './const';
import { RenderCell, RenderHeader, GridChildrenProps, Item, CellItem } from './types';

type CellProps = {
  renderCell: RenderCell;
  renderHeader?: RenderHeader;
} & GridChildrenProps;

const Cell: React.FC<CellProps> = ({
  data,
  columnCount,
  cache,
  items,
  renderCell,
  renderHeader,
}) => {
  const {
    key,
    style: { height: cellHeight, width: cellWidth, left, top, ...style },
    columnIndex,
    rowIndex,
    parent,
  } = data;
  const index = rowIndex * columnCount + columnIndex;
  const item: CellItem = items[index];
  const isItemString = typeof item === 'string';
  const height = item
    ? isItemString
      ? cellHeight
      : Number(cellHeight) - IDEAL_SPACE_BW_TILES
    : undefined;
  const width = item
    ? isItemString
      ? '100%'
      : Number(cellWidth) - IDEAL_SPACE_BW_TILES
    : undefined;
  const wrapperStyles = {
    ...style,
    height,
    width,
    left: Number(left) + IDEAL_SPACE_BW_TILES,
    top: Number(top) + IDEAL_SPACE_BW_TILES,
  };
  return item ? (
    <CellMeasurer
      cache={cache}
      columnIndex={columnIndex}
      key={key}
      parent={parent}
      rowIndex={rowIndex}
    >
      <div style={wrapperStyles} key={key}>
        {isItemString ? renderHeader(item as string) : renderCell(item as Item)}
      </div>
    </CellMeasurer>
  ) : null;
};

export default Cell;
