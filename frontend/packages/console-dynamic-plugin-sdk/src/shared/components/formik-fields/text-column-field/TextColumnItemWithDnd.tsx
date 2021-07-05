import * as React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { TextColumnItemProps, ItemTypes, DragItem } from './text-column-types';
import TextColumnItemContent from './TextColumnItemContent';

const TextColumnItemWithDnd: React.FC<TextColumnItemProps> = (props) => {
  const { idx, onChange, rowValues, arrayHelpers } = props;
  const [, drag, preview] = useDrag({
    item: { type: ItemTypes.TextColumn, id: `${ItemTypes.TextColumn}-${idx}`, idx },
  });
  const [{ opacity }, drop] = useDrop({
    accept: ItemTypes.TextColumn,
    collect: (monitor) => ({
      opacity: monitor.isOver() ? 0 : 1,
    }),
    hover(item: DragItem) {
      if (item.idx === idx) {
        return;
      }
      arrayHelpers.swap(item.idx, idx);
      if (onChange) {
        const values = [...rowValues];
        [values[idx], values[item.idx]] = [values[item.idx], values[idx]];
        onChange(values);
      }
      // monitor item updated here to avoid expensive index searches.
      item.idx = idx;
    },
  });

  return (
    <TextColumnItemContent
      {...props}
      dragRef={drag}
      previewDropRef={(node) => preview(drop(node))}
      opacity={opacity}
    />
  );
};

export default TextColumnItemWithDnd;
