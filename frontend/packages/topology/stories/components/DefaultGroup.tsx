import * as React from 'react';
import { observer } from 'mobx-react';
import {
  useCombineRefs,
  WithDragNodeProps,
  WithSelectionProps,
  Node,
  Rect,
  Layer,
  WithDndDropProps,
  WithDndDragProps,
} from '../../src';

type GroupProps = {
  element: Node;
  droppable?: boolean;
  hover?: boolean;
  canDrop?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDragProps &
  WithDndDropProps;

const DefaultGroup: React.FC<GroupProps> = ({
  element,
  children,
  selected,
  onSelect,
  dragNodeRef,
  dndDragRef,
  dndDropRef,
  droppable,
  hover,
  canDrop,
}) => {
  const boxRef = React.useRef<Rect | null>(null);
  const refs = useCombineRefs<SVGRectElement>(dragNodeRef, dndDragRef, dndDropRef);

  if (!droppable || !boxRef.current) {
    // change the box only when not dragging
    boxRef.current = element.getBounds().clone();
  }

  return (
    <Layer id="groups">
      <rect
        ref={refs}
        onClick={onSelect}
        x={boxRef.current.x}
        y={boxRef.current.y}
        width={boxRef.current.width}
        height={boxRef.current.height}
        fill={canDrop && hover ? 'lightgreen' : canDrop && droppable ? 'lightblue' : '#ededed'}
        strokeWidth={2}
        stroke={selected ? 'blue' : '#cdcdcd'}
      />
      {children}
    </Layer>
  );
};

export default observer(DefaultGroup);
