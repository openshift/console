import * as React from 'react';
import { Table, TableProps } from '@console/internal/components/factory';
import { RouteModel } from '../../models';
import RouteHeader from './RouteHeader';
import RouteRow from './RouteRow';

const RouteList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label={RouteModel.labelPlural}
    Header={RouteHeader}
    Row={RouteRow}
    virtualize
  />
);

export default RouteList;
