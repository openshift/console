import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { RowFunctionArgs, Table, TableProps } from '@console/internal/components/factory';
import { dimensifyHeader } from '../../../../../../utils';
import { AffinityRowData } from '../../types';

export type AffinityTableProps = {
  data?: AffinityRowData[];
  customData?: object;
  Row: React.FC<RowFunctionArgs>;
  columnClasses?: string[];
  getRowProps: TableProps<AffinityRowData>['getRowProps'];
};

export const AffinityTable: React.FC<AffinityTableProps> = ({
  data,
  customData,
  Row,
  columnClasses,
  getRowProps,
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
              title: t('kubevirt-plugin~Type'),
              sortField: 'type',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Condition'),
              sortField: 'condition',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Weight'),
              sortField: 'weight',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Terms'),
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
      getRowProps={getRowProps}
    />
  );
};
