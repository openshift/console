import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { IRow, sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import {
  getName,
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
} from '@console/shared';
import { humanizeCpuCores, ResourceLink } from '@console/internal/components/utils/';
import { Table } from '@console/internal/components/factory';
import { NodeKind } from '@console/internal/module/k8s';
import { getConvertedUnits, getZone } from '../../../utils/install';
import { GetRows, NodeTableProps } from '../types';
import '../ocs-install.scss';

const tableColumnClasses = [
  classNames('pf-u-w-33-on-md', 'pf-u-w-50-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-u-w-inherit-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-u-w-inherit-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-md', 'pf-u-w-inherit-on-md'),
  classNames('pf-u-w-inherit'),
];

const getRows: GetRows = ({ componentProps }) => {
  const { data } = componentProps;

  const rows = data.map((node) => {
    const roles = getNodeRoles(node).sort();
    const cpuSpec: string = getNodeCPUCapacity(node);
    const memSpec: string = getNodeAllocatableMemory(node);
    const cells: IRow['cells'] = [
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
    ];
    return {
      cells,
      props: {
        id: node.metadata.uid,
      },
    };
  });

  return rows;
};

const AttachedDevicesNodeTable: React.FC<NodeTableProps> = (props) => {
  const { t } = useTranslation();

  const { data, customData } = props;
  const { filteredNodes, nodes = [], setNodes } = customData;
  const tableData: NodeKind[] = data.filter(
    (node: NodeKind) =>
      filteredNodes.includes(getName(node)) ||
      filteredNodes.includes(node.metadata.labels?.['kubernetes.io/hostname']),
  );

  React.useEffect(() => {
    if (setNodes && !_.isEqual(tableData, nodes)) {
      setNodes(tableData);
    }
  }, [tableData, setNodes, nodes, filteredNodes]);

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
        data={tableData}
        Rows={getRows}
        Header={getColumns}
        virtualize={false}
      />
    </div>
  );
};

export default AttachedDevicesNodeTable;
