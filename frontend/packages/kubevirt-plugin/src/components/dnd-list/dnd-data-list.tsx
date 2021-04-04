import * as React from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import { DataList, DataListProps } from '@patternfly/react-core';

export const DNDDataList: React.FC<DNDDataListProps> = ({ children, ...props }) => (
  <DndProvider backend={HTML5Backend}>
    <DataList {...props}>{children}</DataList>
  </DndProvider>
);

export type DNDDataListProps = DataListProps;
