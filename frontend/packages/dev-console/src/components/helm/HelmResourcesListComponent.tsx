import * as React from 'react';
import { TableProps, Table } from '@console/internal/components/factory';
import { MsgBox } from '@console/internal/components/utils';
import HelmReleaseResourceTableHeader from './HelmReleaseResourceTableHeader';
import HelmReleaseResourceTableRow from './HelmReleaseResourceTableRow';

const EmptyMsg = () => <MsgBox title="No Resources Found" />;

const HelmResourcesListComponent: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label="Resources"
    defaultSortField="kind"
    Header={HelmReleaseResourceTableHeader}
    Row={HelmReleaseResourceTableRow}
    EmptyMsg={EmptyMsg}
    virtualize
  />
);

export default HelmResourcesListComponent;
