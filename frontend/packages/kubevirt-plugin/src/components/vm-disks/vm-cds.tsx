import * as React from 'react';
import { Table, RowFunction } from '@console/internal/components/factory';
import { dimensifyHeader } from '@console/shared';
import { sortable } from '@patternfly/react-table';

export type VMCDsTableProps = {
  data?: any[];
  customData?: object;
  row: RowFunction;
  columnClasses: string[];
};

export const VMCDsTable: React.FC<VMCDsTableProps> = ({
  data,
  customData,
  row: Row,
  columnClasses,
}) => {
  return (
    <Table
      aria-label="VM Disks List"
      data={data}
      Header={() =>
        dimensifyHeader(
          [
            {
              title: 'Content',
              sortField: 'name',
              transforms: [sortable],
            },
            {
              title: 'Source',
              sortField: 'source',
              transforms: [sortable],
            },
            {
              title: 'Interface',
              sortField: 'diskInterface',
              transforms: [sortable],
            },
            {
              title: 'Storage Class',
              sortField: 'storageClass',
              transforms: [sortable],
            },
            {
              title: '',
            },
          ],
          columnClasses,
        )
      }
      Row={Row}
      customData={{ ...customData, columnClasses }}
      virtualize
      loaded
    />
  );
};
