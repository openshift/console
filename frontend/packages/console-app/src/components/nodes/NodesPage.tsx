import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { getNodeMachineNameAndNamespace, getName, getUID } from '@console/shared';
import { MachineModel, NodeModel } from '@console/internal/models';
import { NodeKind, referenceForModel } from '@console/internal/module/k8s';
import { Table, TableRow, TableData, ListPage } from '@console/internal/components/factory';
import { Kebab, ResourceKebab, ResourceLink } from '@console/internal/components/utils';
import { nodeStatus } from '../../status/node';
import NodeRoles from './NodeRoles';
import { menuActions } from './menu-actions';
import NodeStatus from './NodeStatus';

const tableColumnClasses = [
  classNames('col-md-4', 'col-sm-4', 'col-xs-8'),
  classNames('col-md-3', 'col-sm-4', 'col-xs-4'),
  classNames('col-md-2', 'col-sm-4', 'hidden-xs'),
  classNames('col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const NodeTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Status',
      sortFunc: 'nodeReadiness',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Role',
      sortFunc: 'nodeRoles',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Machine',
      sortField: "metadata.annotations['machine.openshift.io/machine']",
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[4] },
    },
  ];
};
NodeTableHeader.displayName = 'NodeTableHeader';

const NodesTableRow: React.FC<NodesTableRowProps> = ({ obj: node, index, key, style }) => {
  const { name: machineName, namespace: machineNamespace } = getNodeMachineNameAndNamespace(node);
  const nodeName = getName(node);
  const nodeUID = getUID(node);
  return (
    <TableRow id={nodeUID} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={referenceForModel(NodeModel)} name={nodeName} title={nodeUID} />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <NodeStatus node={node} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <NodeRoles node={node} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {machineName && (
          <ResourceLink
            kind={referenceForModel(MachineModel)}
            name={machineName}
            namespace={machineNamespace}
          />
        )}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={referenceForModel(NodeModel)} resource={node} />
      </TableData>
    </TableRow>
  );
};
NodesTableRow.displayName = 'NodesTableRow';
type NodesTableRowProps = {
  obj: NodeKind;
  index: number;
  key?: string;
  style: object;
};

const NodesTable: React.FC<NodesTableProps> = (props) => (
  <Table {...props} aria-label="Nodes" Header={NodeTableHeader} Row={NodesTableRow} virtualize />
);
type NodesTableProps = React.ComponentProps<typeof Table> & {
  data: NodeKind[];
};

const filters = [
  {
    type: 'node-status',
    selected: ['Ready', 'Not Ready'],
    reducer: nodeStatus,
    items: [
      { id: 'Ready', title: 'Ready' },
      { id: 'Not Ready', title: 'Not Ready' },
    ],
  },
];

const NodesPage = (props) => (
  <ListPage {...props} ListComponent={NodesTable} rowFilters={filters} />
);

export default NodesPage;
