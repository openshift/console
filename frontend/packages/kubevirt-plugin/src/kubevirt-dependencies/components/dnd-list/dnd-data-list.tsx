import * as React from 'react';
import { DataList, DataListProps } from '@patternfly/react-core';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

export const DNDDataList: React.FC<DNDDataListProps> = ({ children, ...props }) => (
  <DndProvider backend={HTML5Backend}>
    <DataList {...props}>{children}</DataList>
  </DndProvider>
);

export type DNDDataListProps = DataListProps;
