import * as React from 'react';
import { Table, TableProps } from '@console/internal/components/factory';
import ChannelHeaders from './ChannelHeaders';
import ChannelRow from './ChannelRow';

const ChannelList: React.FC<TableProps> = (props) => (
  <Table {...props} aria-label="Channels" Header={ChannelHeaders} Row={ChannelRow} virtualize />
);

export default ChannelList;
