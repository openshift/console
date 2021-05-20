import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as classNames from 'classnames';
import { IRow, sortable, Table as PfTable, TableHeader, TableBody } from '@patternfly/react-table';
import { Spinner, Bullseye, EmptyState, Title } from '@patternfly/react-core';
import {
  getName,
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
} from '@console/shared';
import { humanizeCpuCores, ResourceLink } from '@console/internal/components/utils/';
import { Table } from '@console/internal/components/factory';
import { getConvertedUnits, getZone } from '../../../utils/install';
import { GetNodeRows, NodeTableProps, NodeKindWithLoading } from '../../../types';
import '../ocs-install.scss';

const tableColumnClasses = [
  classNames('pf-u-w-33-on-md', 'pf-u-w-50-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-u-w-inherit-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-u-w-inherit-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-md', 'pf-u-w-inherit-on-md'),
  classNames('pf-u-w-inherit'),
];

const EmptyMessage: React.FC = () => {
  const { t } = useTranslation();

  const cells = [
    t('ceph-storage-plugin~Name'),
    t('ceph-storage-plugin~Role'),
    t('ceph-storage-plugin~CPU'),
    t('ceph-storage-plugin~Memory'),
    t('ceph-storage-plugin~Zone'),
  ];
  const rows = [
    {
      heightAuto: true,
      cells: [
        {
          props: { colSpan: 6 },
          title: (
            <Bullseye>
              <EmptyState>
                <Spinner size="md" />
                <Title size="md" headingLevel="h4">
                  {t(
                    'ceph-storage-plugin~PVs are being provisioned on the selected nodes. Node list will be loaded in a few moments.',
                  )}
                </Title>
              </EmptyState>
            </Bullseye>
          ),
        },
      ],
    },
  ];
  return (
    <PfTable cells={cells} rows={rows}>
      <TableHeader />
      <TableBody />
    </PfTable>
  );
};

const LoadingItem: React.FC = () => <div className="loading-skeleton--table-row" />;

const loadingCells: IRow['cells'] = [
  {
    title: <LoadingItem />,
  },
  {
    title: <LoadingItem />,
  },
  {
    title: <LoadingItem />,
  },
  {
    title: <LoadingItem />,
  },
  {
    title: <LoadingItem />,
  },
];

const getRows: GetNodeRows<NodeKindWithLoading> = ({ componentProps }) => {
  const { data } = componentProps;

  const rows = data.map((node) => {
    const roles = getNodeRoles(node).sort();
    const cpuSpec: string = getNodeCPUCapacity(node);
    const memSpec: string = getNodeAllocatableMemory(node);
    const cells: IRow['cells'] = !node?.loading
      ? [
          {
            title: <ResourceLink kind="Node" name={getName(node)} title={getName(node)} />,
          },
          {
            title: roles.join(', ') || '-',
          },
          {
            title: `${humanizeCpuCores(cpuSpec).string || '-'}`,
          },
          {
            title: `${getConvertedUnits(memSpec)}`,
          },
          {
            title: getZone(node) || '-',
          },
        ]
      : loadingCells;
    return {
      cells,
      props: {
        id: node.metadata.uid,
      },
    };
  });

  return rows;
};

const AttachedDevicesNodeTable: React.FC<NodeTableProps<NodeKindWithLoading>> = (props) => {
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
    <div className="ceph-ocs-install__select-nodes-table">
      <Table
        {...props}
        aria-label={t('ceph-storage-plugin~Node Table')}
        data-test-id="attached-devices-nodes-table"
        Rows={getRows}
        Header={getColumns}
        virtualize={false}
        NoDataEmptyMsg={EmptyMessage}
      />
    </div>
  );
};

export default AttachedDevicesNodeTable;
