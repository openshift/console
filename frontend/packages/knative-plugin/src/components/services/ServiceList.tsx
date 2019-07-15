import * as React from 'react';
import { Table, TableProps } from '@console/internal/components/factory';
import { ServiceModel } from '../../models';
import ServiceHeader from './ServiceHeader';
import ServiceRow from './ServiceRow';

const ServiceList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label={ServiceModel.labelPlural}
    Header={ServiceHeader}
    Row={ServiceRow}
    virtualize
  />
);

export default ServiceList;
