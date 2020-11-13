import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <Table
      aria-label="VM Disks List"
      data={data}
      Header={() =>
        dimensifyHeader(
          [
            {
              title: t('kubevirt-plugin~Content'),
              sortField: 'name',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Source'),
              sortField: 'source',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Interface'),
              sortField: 'diskInterface',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Storage Class'),
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
