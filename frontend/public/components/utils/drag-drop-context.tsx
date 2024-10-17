import * as React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const withDragDropContext = <TProps extends {}>(
  Component: React.ComponentClass<TProps> | React.FC<TProps>,
) => (props: TProps) => {
  return (
    <DndProvider backend={HTML5Backend} context={window}>
      <Component {...props} />
    </DndProvider>
  );
};

export default withDragDropContext;
