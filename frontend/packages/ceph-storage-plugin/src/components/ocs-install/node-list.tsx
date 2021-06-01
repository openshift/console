import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import {
  getName,
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
  hasLabel,
} from '@console/shared';
import { useSelectList } from '@console/shared/src/hooks/select-list';
import { humanizeCpuCores, ResourceLink } from '@console/internal/components/utils/';
import { NodeKind } from '@console/internal/module/k8s';
import { Table } from '@console/internal/components/factory';
import { IRow, sortable } from '@patternfly/react-table';
import { getConvertedUnits, nodesWithoutTaints, getZone } from '../../utils/install';
import { cephStorageLabel } from '../../selectors';
import { GetRows, NodeTableProps } from '../../types';
import './ocs-install.scss';

const tableColumnClasses = [
  classNames('pf-u-w-33-on-md', 'pf-u-w-50-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl', 'pf-u-w-inherit-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl', 'pf-u-w-inherit-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl', 'pf-u-w-inherit-on-xl'),
  classNames('pf-u-w-inherit'),
];

// Same columns are used for attached devices mode tables

const getRows: GetRows = (
  { componentProps },
  visibleRows,
  setVisibleRows,
  selectedNodes,
  setSelectedNodes,
) => {
  const { data } = componentProps;

  const filteredData = nodesWithoutTaints(data);

  const rows = filteredData.map((node: NodeKind) => {
    const roles = getNodeRoles(node).sort();
    const cpuSpec: string = getNodeCPUCapacity(node);
    const memSpec: string = getNodeAllocatableMemory(node);
    const cells: IRow['cells'] = [
      {
        title: <ResourceLink kind="Node" name={getName(node)} title={getName(node)} />,
      },
      {
        title: roles.join(', ') ?? '-',
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
      selected: selectedNodes
        ? selectedNodes.has(node.metadata.uid)
        : hasLabel(node, cephStorageLabel),
      props: {
        id: node.metadata.uid,
      },
    };
  });

  const uids = new Set(filteredData.map((n) => n.metadata.uid));

  if (!_.isEqual(uids, visibleRows)) {
    setVisibleRows(uids);
    if (!selectedNodes?.size && filteredData.length) {
      const preSelected = filteredData.filter((row) => hasLabel(row, cephStorageLabel));
      setSelectedNodes(preSelected);
    }
  }

  return rows;
};

const InternalNodeTable: React.FC<NodeTableProps> = (props) => {
  const { t } = useTranslation();

  const [visibleRows, setVisibleRows] = React.useState<Set<string>>(props.customData.nodes);
  const {
    onSelect,
    selectedRows: selectedNodes,
    updateSelectedRows: setSelectedNodes,
  } = useSelectList<NodeKind>(props.data, visibleRows, props.customData.onRowSelected);

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
        aria-label={t('ceph-storage-plugin~Node Table')}
        data-test-id="select-nodes-table"
        {...props}
        Rows={(rowProps) =>
          getRows(rowProps, visibleRows, setVisibleRows, selectedNodes, setSelectedNodes)
        }
        Header={getColumns}
        virtualize={false}
        onSelect={onSelect}
      />
    </div>
  );
};

export default InternalNodeTable;
