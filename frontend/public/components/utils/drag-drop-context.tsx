import * as React from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

const withDragDropContext = <TProps extends {}>(
  Component: React.ComponentClass<TProps> | React.FC<TProps>,
) => (props: TProps) => (
  <DndProvider backend={HTML5Backend}>
    <Component {...props} />
  </DndProvider>
);

export default withDragDropContext;
