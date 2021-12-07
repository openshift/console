import * as React from 'react';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { sortable, IRow } from '@patternfly/react-table';
import { Table } from '@console/internal/components/factory';
import { humanizeCpuCores, ResourceLink } from '@console/internal/components/utils';
import { WizardNodeState } from '../../reducer';
import { SelectNodesTableFooter } from '../../select-nodes-table/select-nodes-table-footer';
import { getConvertedUnits } from '../../../../utils/install';

const tableColumnClasses = [
  classnames('pf-u-w-40-on-sm'),
  classnames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classnames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classnames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classnames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
];

const getRows = ({ componentProps }) => {
  const { data } = componentProps;

  return data.map((node: WizardNodeState) => {
    const { cpu, memory, zone, name, roles } = node;

    const cells: IRow['cells'] = [
      {
        title: <ResourceLink kind="Node" name={name} title={name} />,
      },
      {
        title: roles.join(', ') ?? '-',
      },
      {
        title: `${humanizeCpuCores(cpu).string || '-'}`,
      },
      {
        title: `${getConvertedUnits(memory)}`,
      },
      {
        title: zone ?? '-',
      },
    ];

    return {
      cells,
    };
  });
};

export const SelectedNodesTable: React.FC<SelectedNodesTableProps> = ({ data }) => {
  const { t } = useTranslation();

  const getColumns = () => [
    {
      title: t('ceph-storage-plugin~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('ceph-storage-plugin~Role'),
      props: { className: tableColumnClasses[1] },
    },
    {
      title: t('ceph-storage-plugin~CPU'),
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('ceph-storage-plugin~Memory'),
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('ceph-storage-plugin~Zone'),
      props: { className: tableColumnClasses[4] },
    },
  ];

  return (
    <>
      <Table
        aria-label={t('ceph-storage-plugin~Selected nodes table')}
        Header={getColumns}
        data={data}
        Rows={getRows}
        virtualize={false}
        loaded
      />
      {!!data.length && <SelectNodesTableFooter nodes={data} />}
    </>
  );
};

type SelectedNodesTableProps = {
  data: WizardNodeState[];
};
