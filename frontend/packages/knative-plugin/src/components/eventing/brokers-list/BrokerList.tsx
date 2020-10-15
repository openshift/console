import * as React from 'react';
import { Table, TableProps } from '@console/internal/components/factory';
import BrokerHeaders from './BrokerHeaders';
import BrokerRow from './BrokerRow';

const BrokerList: React.FC<TableProps> = (props) => (
  <Table {...props} aria-label="Brokers" Header={BrokerHeaders} Row={BrokerRow} virtualize />
);

export default BrokerList;
