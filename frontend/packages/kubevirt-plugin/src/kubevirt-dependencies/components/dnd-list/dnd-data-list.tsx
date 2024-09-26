import * as React from 'react';
import { DataList } from '@patternfly/react-core';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

export type DNDDataListProps = {
  id: string;
  'aria-label': string;
  children: React.ReactNode;
};

export const DNDDataList: React.FC<DNDDataListProps> = ({ children, ...props }) => (
  <DndProvider backend={HTML5Backend}>
    <DataList {...props}>{children}</DataList>
  </DndProvider>
);

// export type DNDDataListProps = DataListProps;
