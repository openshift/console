import * as React from 'react';
import { CellMeasurer } from 'react-virtualized';
import { RenderCell, RenderHeader, GridChildrenProps, Item, CellItem } from './types';
import { getHeightAndWidthOfCell, CellMeasurementContext } from './utils';

type CellProps = {
  renderCell: RenderCell;
  renderHeader?: RenderHeader;
} & GridChildrenProps;

const Cell: React.FC<CellProps> = ({ data, columnCount, items, renderCell, renderHeader }) => {
  const { cache, cellMargin } = React.useContext(CellMeasurementContext);
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

  const { width, height } = getHeightAndWidthOfCell(cellHeight, cellWidth, item);
  const wrapperStyles = {
    ...style,
    height,
    width,
    left: Number(left) + cellMargin,
    top: Number(top) + cellMargin,
  };
  return item ? (
    <CellMeasurer
      cache={cache}
      columnIndex={columnIndex}
      key={key}
      parent={parent}
      rowIndex={rowIndex}
    >
      <div style={wrapperStyles}>
        {isItemString ? renderHeader(item as string) : renderCell(item as Item)}
      </div>
    </CellMeasurer>
  ) : null;
};

export default Cell;
