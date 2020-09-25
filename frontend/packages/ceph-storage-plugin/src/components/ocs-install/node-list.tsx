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
import { humanizeCpuCores, ResourceLink, pluralize } from '@console/internal/components/utils/';
import { NodeKind } from '@console/internal/module/k8s';
import { Table } from '@console/internal/components/factory';
import { IRow } from '@patternfly/react-table';
import { hasOCSTaint, hasTaints, getConvertedUnits } from '../../utils/install';
import { cephStorageLabel } from '../../selectors';
import { GetRows, NodeTableProps } from './types';

import './ocs-install.scss';

const tableColumnClasses = [
  classNames('pf-u-w-50-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-sm', 'pf-u-w-10-on-sm'),
];

export const getColumns = () => [
  {
    title: 'Name',
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Role',
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Zone',
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'CPU',
    props: { className: tableColumnClasses[3] },
  },
  {
    title: 'Memory',
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

  const filteredData = data.filter((node: NodeKind) => hasOCSTaint(node) || !hasTaints(node));

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
        title: node.metadata.labels?.['failure-domain.beta.kubernetes.io/zone'] ?? '-',
      },
      {
        title: `${humanizeCpuCores(cpuSpec).string || '-'}`,
      },
      {
        title: `${getConvertedUnits(memSpec)}`,
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

const NodeTable: React.FC<NodeTableProps> = (props) => {
  const [visibleRows, setVisibleRows] = React.useState<Set<string>>();

  const {
    onSelect,
    selectedRows: selectedNodes,
    updateSelectedRows: setSelectedNodes,
  } = useSelectList<NodeKind>(props.data, visibleRows, props.customData.onRowSelected);

  return (
    <>
      <div className="ceph-node-list__max-height ceph-ocs-install__node-list">
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
      <p className="control-label help-block" data-test-id="nodes-selected">
        {pluralize(selectedNodes?.size, 'node')} selected
      </p>
    </>
  );
};

export default NodeTable;
