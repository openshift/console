import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { RowFunction, Table } from '@console/internal/components/factory';
import { dimensifyHeader } from '../../../../../../utils';
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
  const { t } = useTranslation();
  return (
    <Table
      aria-label={t('kubevirt-plugin~Affinity List')}
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
