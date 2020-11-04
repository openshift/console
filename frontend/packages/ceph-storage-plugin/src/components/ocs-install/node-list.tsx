import * as React from 'react';
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
import { hasOCSTaint, hasNoTaints, getConvertedUnits } from '../../utils/install';
import { cephStorageLabel } from '../../selectors';
import { ZONE_LABELS } from '../../constants';
import { GetRows, NodeTableProps } from './types';
import './ocs-install.scss';

const tableColumnClasses = [
  classNames('pf-u-w-33-on-md', 'pf-u-w-50-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-u-w-inherit-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-u-w-inherit-on-lg'),
  classNames('pf-m-hidden', 'pf-m-visible-on-md', 'pf-u-w-inherit-on-md'),
  classNames('pf-u-w-inherit'),
];

// Same columns are used for attached devices mode tables
export const getColumns = () => [
  {
    title: 'Name',
    sortField: 'metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Role',
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'CPU',
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Memory',
    props: { className: tableColumnClasses[3] },
  },
  {
    title: 'Zone',
    props: { className: tableColumnClasses[4] },
  },
];

const getRows: GetRows = (
  { componentProps },
  visibleRows,
  setVisibleRows,
  selectedNodes,
  setSelectedNodes,
) => {
  const { data } = componentProps;

  const filteredData = data.filter((node: NodeKind) => hasOCSTaint(node) || hasNoTaints(node));

  const rows = filteredData.map((node: NodeKind) => {
    const roles = getNodeRoles(node).sort();
    const cpuSpec: string = getNodeCPUCapacity(node);
    const memSpec: string = getNodeAllocatableMemory(node);
    const nodeLabels = node.metadata?.labels;
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
        title: nodeLabels[ZONE_LABELS[0]] || nodeLabels[ZONE_LABELS[1]] || '-',
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
  const [visibleRows, setVisibleRows] = React.useState<Set<string>>(props.customData.nodes);
  const {
    onSelect,
    selectedRows: selectedNodes,
    updateSelectedRows: setSelectedNodes,
  } = useSelectList<NodeKind>(props.data, visibleRows, props.customData.onRowSelected);

  return (
    <div className="ceph-ocs-install__select-nodes-table">
      <Table
        aria-label="Node Table"
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
