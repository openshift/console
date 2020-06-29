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

import './ocs-install.scss';

const tableColumnClasses = [
  classNames('col-md-1', 'col-sm-1', 'col-xs-1'),
  classNames('col-md-4', 'col-sm-8', 'col-xs-11'),
  classNames('col-md-2', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-1', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
];

const getColumns = () => {
  return [
    {
      title: 'Name',
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Role',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Location',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'CPU',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Memory',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

const isSelected = (selected: Set<string>, nodeUID: string): boolean => selected.has(nodeUID);

type GetRows = (
  {
    componentProps,
  }: {
    componentProps: { data: NodeKind[] };
  },
  visibleRows: Set<string>,
  setVisibleRows: React.Dispatch<React.SetStateAction<Set<string>>>,
  selectedNodes: Set<string>,
  setSelectedNodes: (nodes: NodeKind[]) => void,
) => NodeTableRow[];

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
        title: <ResourceLink kind="Node" name={getName(node)} title={node.metadata.uid} />,
      },
      {
        title: roles.join(', ') || '-',
      },
      {
        title: node.metadata.labels?.['failure-domain.beta.kubernetes.io/zone'] || '-',
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
        ? isSelected(selectedNodes, node.metadata.uid)
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
      <div className="ceph-node-list__max-height">
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

type NodeTableProps = {
  data: NodeKind[];
  customData: {
    onRowSelected: (nodes: NodeKind[]) => void;
  };
  filters: { name: string; label: { all: string[] } };
};

type NodeTableRow = {
  cells: IRow['cells'];
  props: {
    id: string;
  };
  selected: boolean;
};
