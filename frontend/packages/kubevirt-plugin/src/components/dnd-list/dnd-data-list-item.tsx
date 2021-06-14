import * as React from 'react';
import {
  DataListCell,
  DataListItem,
  DataListItemCells,
  DataListItemProps,
  DataListItemRow,
} from '@patternfly/react-core';
import { MinusCircleIcon, GripVerticalIcon } from '@patternfly/react-icons';
import { useDrag, useDrop } from 'react-dnd';

const DNDDataListItemTypeName = 'dnd-row';
const DNDDataListCellMoveStyle = { cursor: 'move' };
const DNDDataListCellSDeleteStyle = { cursor: 'pointer' };

export interface DNDDataListItemProps extends DataListItemProps {
  /** Order index of rendered item. */
  index: number;
  /** Action when delete icon is pressed. */
  onDelete: (index: number) => void;
  /** Action when item is moved from one order index to anoter. */
  onMove: (index: number, toIndex: number) => void;
}

export const DNDDataListItem: React.FC<DNDDataListItemProps> = ({
  index,
  onDelete,
  onMove,
  'aria-labelledby': ariaLabelledby,
  children,
  ...props
}) => {
  // Create a drag item copy.
  const [, drag, preview] = useDrag({
    item: { type: DNDDataListItemTypeName, id: `${DNDDataListItemTypeName}-${index}`, index },
  });
  // Move item when hover over onoter item.
  const [{ opacity }, drop] = useDrop({
    accept: DNDDataListItemTypeName,
    collect: (monitor) => ({
      opacity: monitor.isOver() ? 0 : 1,
    }),
    hover(item: any) {
      if (item.index === index) {
        return;
      }

      onMove(item.index, index);
      item.index = index;
    },
  });

  // Action when item is focused and key is pressed:
  // ArrowUp:   move item one order index down.
  // ArrowDown: move item one order index up.
  // '-':       delete an item.
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        if (index > 0) onMove(index, index - 1);
        break;
      case 'ArrowDown':
        onMove(index, index + 1);
        break;
      case '-':
        onDelete(index);
        break;
      default:
      // We only accept up, down and minus.
    }
  };

  const cellKey = (i: number | string) => `item-${i}`;
  const dataListCell = [
    <DataListCell isFilled={false} key={cellKey('drag')}>
      <div ref={drag} style={DNDDataListCellMoveStyle}>
        <GripVerticalIcon />
      </div>
    </DataListCell>,
    ...React.Children.map(children, (cell, i) => (
      <DataListCell width={1} key={cellKey(i)}>
        {cell}
      </DataListCell>
    )),
    <DataListCell
      isFilled={false}
      alignRight
      key={cellKey('delete')}
      style={DNDDataListCellSDeleteStyle}
      onClick={() => onDelete(index)}
    >
      <MinusCircleIcon />
    </DataListCell>,
  ];

  return (
    <div ref={(node) => preview(drop(node))} style={{ opacity }}>
      <DataListItem tabIndex={0} aria-labelledby={ariaLabelledby} onKeyDown={onKeyDown} {...props}>
        <DataListItemRow>
          <DataListItemCells dataListCells={dataListCell} />
        </DataListItemRow>
      </DataListItem>
    </div>
  );
};
