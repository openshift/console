import type { ComponentClass, FC, ReactNode } from 'react';
import { DndProvider, DndProviderProps } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// TODO: bump react-dnd so this is not needed
// React 18: DndProvider types don't include children, but it accepts them
const DndProviderWithChildren = DndProvider as FC<
  DndProviderProps<any, any> & { children?: ReactNode }
>;

const withDragDropContext = <TProps extends {}>(Component: ComponentClass<TProps> | FC<TProps>) => (
  props: TProps,
) => {
  return (
    <DndProviderWithChildren backend={HTML5Backend} context={window}>
      <Component {...props} />
    </DndProviderWithChildren>
  );
};

export default withDragDropContext;
