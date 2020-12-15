import * as React from 'react';
import { TableProps, Table } from '@console/internal/components/factory';
import { MsgBox } from '@console/internal/components/utils';
import HelmReleaseResourcesHeader from './HelmReleaseResourcesHeader';
import HelmReleaseResourcesRow from './HelmReleaseResourcesRow';

const HelmReleaseResourcesList: React.FC<TableProps> = (props) => (
  <Table
    {...props}
    aria-label="Resources"
    defaultSortField="kind"
    Header={HelmReleaseResourcesHeader}
    Row={HelmReleaseResourcesRow}
    EmptyMsg={() => <MsgBox title="No Resources Found" />}
    virtualize
  />
);

export default HelmReleaseResourcesList;
