import * as React from 'react';
import * as classNames from 'classnames';
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { sortable } from '@patternfly/react-table';
import { DASH, getName, getUID, getNamespace, SecondaryStatus } from '@console/shared';
import { TableRow, TableData, Table, RowFunction } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import NodeRoles from '@console/app/src/components/nodes/NodeRoles';
import { MachineModel, NodeModel } from '@console/internal/models';
import { BareMetalNodeBundle } from '../types';
import { getHostBMCAddress } from '../../selectors';
import { BareMetalHostModel } from '../../models';
import { baremetalNodeSecondaryStatus } from '../../status/baremetal-node-status';
import { menuActions } from './menu-actions';
import BareMetalNodeStatus from './BareMetalNodeStatus';

const tableColumnClasses = {
  name: classNames('col-lg-3', 'col-md-4', 'col-sm-12', 'col-xs-12'),
  status: classNames('col-lg-3', 'col-md-4', 'col-sm-6', 'hidden-xs'),
  role: classNames('col-lg-2', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  machine: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  address: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  kebab: Kebab.columnClass,
};

const BareMetalNodesTableHeader = () => [
  {
    title: 'Name',
    sortField: 'node.metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses.name },
  },
  {
    title: 'Status',
    sortField: 'status.status',
    transforms: [sortable],
    props: { className: tableColumnClasses.status },
  },
  {
    title: 'Role',
    sortField: 'machine.metadata.labels["machine.openshift.io/cluster-api-machine-role"]',
    transforms: [sortable],
    props: { className: tableColumnClasses.role },
  },
  {
    title: 'Machine',
    sortField: "metadata.annotations['machine.openshift.io/machine']",
    transforms: [sortable],
    props: { className: tableColumnClasses.machine },
  },
  {
    title: 'Management Address',
    sortField: 'host.spec.bmc.address',
    transforms: [sortable],
    props: { className: tableColumnClasses.address },
  },
  {
    title: '',
    props: { className: tableColumnClasses.kebab },
  },
];

const BareMetalNodesTableRow: RowFunction<
  BareMetalNodeBundle,
  {
    hasNodeMaintenanceCapability: boolean;
  }
> = ({
  obj: { host, node, nodeMaintenance, machine, status },
  customData: { hasNodeMaintenanceCapability },
  index,
  key,
  style,
}) => {
  const nodeName = getName(node);
  const hostName = getName(host);
  const namespace = getNamespace(host);
  const address = getHostBMCAddress(host);
  const uid = getUID(node);

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses.name}>
        {node ? (
          <ResourceLink kind="Node" name={nodeName} />
        ) : (
          <ResourceLink
            kind={referenceForModel(BareMetalHostModel)}
            name={hostName}
            namespace={namespace}
          />
        )}
      </TableData>
      <TableData className={tableColumnClasses.status}>
        <BareMetalNodeStatus {...status} />
        <SecondaryStatus status={baremetalNodeSecondaryStatus({ node, nodeMaintenance, host })} />
      </TableData>
      <TableData className={tableColumnClasses.role}>
        <NodeRoles node={node} />
      </TableData>
      <TableData className={tableColumnClasses.machine}>
        {machine ? (
          <ResourceLink
            kind={referenceForModel(MachineModel)}
            name={getName(machine)}
            namespace={getNamespace(machine)}
          />
        ) : (
          DASH
        )}
      </TableData>
      <TableData className={tableColumnClasses.address}>{address}</TableData>
      <TableData className={tableColumnClasses.kebab}>
        <Kebab
          options={menuActions.map((action) =>
            action(NodeModel, node, null, { nodeMaintenance, hasNodeMaintenanceCapability }),
          )}
          key={`kebab-for-${uid}`}
          id={`kebab-for-${uid}`}
        />
      </TableData>
    </TableRow>
  );
};

type BareMetalNodesTableProps = React.ComponentProps<typeof Table> & {
  data: BareMetalNodeBundle[];
  customData: {
    hasNodeMaintenanceCapability: boolean;
  };
};

const BareMetalNodesTable: React.FC<BareMetalNodesTableProps> = (props) => {
  return (
    <Table
      {...props}
      defaultSortField="node.metadata.name"
      aria-label="Nodes"
      Header={BareMetalNodesTableHeader}
      Row={BareMetalNodesTableRow}
      virtualize
    />
  );
};

export default BareMetalNodesTable;
