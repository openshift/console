import * as React from 'react';
import { Table, TableProps } from '@console/internal/components/factory';
import EventSourceHeaders from './EventSourceHeaders';
import EventSourceRow from './EventSourceRow';

const EventSourceList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label="Event Sources"
    Header={EventSourceHeaders}
    Row={EventSourceRow}
    virtualize
  />
);

export default EventSourceList;
