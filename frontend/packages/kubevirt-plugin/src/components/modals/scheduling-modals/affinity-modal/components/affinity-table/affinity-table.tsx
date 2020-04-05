import * as React from 'react';
import { Table, RowFunction } from '@console/internal/components/factory';
import { dimensifyHeader } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { AffinityRowData } from '../../types';

export type AffinityTableProps = {
  data?: AffinityRowData[];
  customData?: object;
  row: RowFunction;
  columnClasses?: string[];
};

export const AffinityTable: React.FC<AffinityTableProps> = ({
  data,
  customData,
  row: Row,
  columnClasses,
}) => {
  return (
    <Table
      aria-label="Affinity List"
      data={data}
      Header={() =>
        dimensifyHeader(
          [
            {
              title: 'Type',
              sortField: 'type',
              transforms: [sortable],
            },
            {
              title: 'Condition',
              sortField: 'condition',
              transforms: [sortable],
            },
            {
              title: 'Weight',
              sortField: 'weight',
              transforms: [sortable],
            },
            {
              title: 'Terms',
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
