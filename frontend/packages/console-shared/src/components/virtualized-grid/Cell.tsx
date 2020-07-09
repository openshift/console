import * as React from 'react';
import { CellMeasurer } from 'react-virtualized';
import { RenderCell, RenderHeader, GridChildrenProps, Item, CellItem } from './types';
import { CellMeasurementContext } from './utils';

type CellProps = {
  renderCell: RenderCell;
  renderHeader?: RenderHeader;
  style?: React.CSSProperties;
} & GridChildrenProps;

const Cell: React.FC<CellProps> = ({
  data,
  columnCount,
  items,
  rowCount,
  style: { width, ...style },
  renderCell,
  renderHeader,
}) => {
  const { cache, cellMargin } = React.useContext(CellMeasurementContext);
  const { key, columnIndex, rowIndex, parent } = data;
  const index = rowIndex * columnCount + columnIndex;
  const item: CellItem = items[index];
  const isItemString = typeof item === 'string';

  const cellStyle = {
    ...style,
    width: isItemString ? '100%' : width,
    padding: `${cellMargin}px ${cellMargin}px ${
      rowIndex === rowCount - 1 ? `${cellMargin}px` : 0
    } ${cellMargin}px`,
  };

  return item ? (
    <CellMeasurer
      cache={cache}
      columnIndex={columnIndex}
      key={key}
      parent={parent}
      rowIndex={rowIndex}
    >
      <div style={cellStyle}>
        {isItemString ? renderHeader(item as string) : renderCell(item as Item)}
      </div>
    </CellMeasurer>
  ) : null;
};

export default Cell;
