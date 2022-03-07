import * as React from 'react';
import { DndProvider, createDndContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

const dndContext = createDndContext(HTML5Backend);

const withDragDropContext = <TProps extends {}>(
  Component: React.ComponentClass<TProps> | React.FC<TProps>,
) => (props: TProps) => {
  const manager = React.useRef(dndContext);
  return (
    <DndProvider manager={manager.current.dragDropManager}>
      <Component {...props} />
    </DndProvider>
  );
};

export default withDragDropContext;
