import * as React from 'react';
import * as classNames from 'classnames';
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { sortable } from '@patternfly/react-table';
import { getName, getUID, getNamespace } from '@console/shared';
import { TableRow, TableData, Table } from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { BareMetalHostBundle } from '../types';
import { getHostBMCAddress } from '../../selectors';
import { BareMetalHostModel } from '../../models';
import NodeLink from './NodeLink';
import BareMetalHostStatus from './BareMetalHostStatus';
import BareMetalHostRole from './BareMetalHostRole';
import { menuActions } from './host-menu-actions';
import BareMetalHostSecondaryStatus from './BareMetalHostSecondaryStatus';

const tableColumnClasses = {
  name: classNames('col-lg-3', 'col-md-4', 'col-sm-12', 'col-xs-12'),
  status: classNames('col-lg-3', 'col-md-4', 'col-sm-6', 'hidden-xs'),
  node: classNames('col-lg-2', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  role: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  address: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  kebab: Kebab.columnClass,
};

const HostsTableHeader = () => [
  {
    title: 'Name',
    sortField: 'host.metadata.name',
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
    title: 'Node',
    sortField: 'node.metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses.node },
  },
  {
    title: 'Role',
    sortField: 'machine.metadata.labels["machine.openshift.io/cluster-api-machine-role"]',
    transforms: [sortable],
    props: { className: tableColumnClasses.role },
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

type HostsTableRowProps = {
  obj: BareMetalHostBundle;
  customData: {
    hasNodeMaintenanceCapability: boolean;
  };
  index: number;
  key?: string;
  style: React.StyleHTMLAttributes<any>;
};

const HostsTableRow: React.FC<HostsTableRowProps> = ({
  obj: { host, node, nodeMaintenance, machine, status },
  customData: { hasNodeMaintenanceCapability },
  index,
  key,
  style,
}) => {
  const name = getName(host);
  const namespace = getNamespace(host);
  const address = getHostBMCAddress(host);
  const uid = getUID(host);
  const nodeName = getName(node);

  return (
    <TableRow id={uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses.name}>
        <ResourceLink
          kind={referenceForModel(BareMetalHostModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses.status}>
        <BareMetalHostStatus {...status} />
        <BareMetalHostSecondaryStatus host={host} />
      </TableData>
      <TableData className={tableColumnClasses.node}>
        <NodeLink nodeName={nodeName} />
      </TableData>
      <TableData className={tableColumnClasses.role}>
        <BareMetalHostRole machine={machine} node={node} />
      </TableData>
      <TableData className={tableColumnClasses.address}>{address}</TableData>
      <TableData className={tableColumnClasses.kebab}>
        <Kebab
          options={menuActions.map((action) =>
            action(BareMetalHostModel, host, null, {
              nodeMaintenance,
              nodeName,
              hasNodeMaintenanceCapability,
              status: status.status,
            }),
          )}
          key={`kebab-for-${uid}`}
          id={`kebab-for-${uid}`}
        />
      </TableData>
    </TableRow>
  );
};

type BareMetalHostsTableProps = React.ComponentProps<typeof Table> & {
  data: BareMetalHostBundle[];
  customData: {
    hasNodeMaintenanceCapability: boolean;
  };
};

const BareMetalHostsTable: React.FC<BareMetalHostsTableProps> = (props) => (
  <Table
    {...props}
    defaultSortField="host.metadata.name"
    aria-label="Bare Metal Hosts"
    Header={HostsTableHeader}
    Row={HostsTableRow}
    virtualize
  />
);

export default BareMetalHostsTable;
