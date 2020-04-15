import * as React from 'react';
import * as classNames from 'classnames';
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { sortable } from '@patternfly/react-table';
import { getName, getUID, getNamespace, DASH } from '@console/shared';
import {
  TableRow,
  TableData,
  Table,
  RowFunction,
  RowFunctionArgs,
} from '@console/internal/components/factory';
import { referenceForModel } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/flag';
import { BareMetalHostBundle } from '../types';
import { getHostBMCAddress, getHostVendorInfo } from '../../selectors';
import { BareMetalHostModel } from '../../models';
import NodeLink from './NodeLink';
import BareMetalHostStatus from './BareMetalHostStatus';
import BareMetalHostRole from './BareMetalHostRole';
import { menuActions } from './host-menu-actions';
import BareMetalHostSecondaryStatus from './BareMetalHostSecondaryStatus';
import { NODE_MAINTENANCE_FLAG } from '../../features';

const tableColumnClasses = {
  name: classNames('col-lg-2', 'col-md-4', 'col-sm-12', 'col-xs-12'),
  status: classNames('col-lg-2', 'col-md-4', 'col-sm-6', 'hidden-xs'),
  node: classNames('col-lg-2', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  role: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  address: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  serialNumber: classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
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
    title: 'Serial Number',
    sortField: 'host.status.hardware.systemVendor.serialNumber',
    transforms: [sortable],
    props: { className: tableColumnClasses.serialNumber },
  },
  {
    title: '',
    props: { className: tableColumnClasses.kebab },
  },
];

const HostsTableRow: React.FC<RowFunctionArgs<BareMetalHostBundle>> = ({
  obj: { host, node, nodeMaintenance, machine, machineSet, status },
  index,
  key,
  style,
}) => {
  const hasNodeMaintenanceCapability = useFlag(NODE_MAINTENANCE_FLAG);
  const name = getName(host);
  const namespace = getNamespace(host);
  const address = getHostBMCAddress(host);
  const uid = getUID(host);
  const nodeName = getName(node);
  const { serialNumber } = getHostVendorInfo(host);

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
      <TableData className={tableColumnClasses.address}>{address || DASH}</TableData>
      <TableData className={tableColumnClasses.serialNumber}>{serialNumber || DASH}</TableData>
      <TableData className={tableColumnClasses.kebab}>
        <Kebab
          options={menuActions.map((action) =>
            action(BareMetalHostModel, host, {
              nodeMaintenance,
              nodeName,
              hasNodeMaintenanceCapability,
              machine,
              machineSet,
              status,
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
};

const BareMetalHostsTable: React.FC<BareMetalHostsTableProps> = (props) => {
  const row = React.useCallback<RowFunction<BareMetalHostBundle>>(
    (rowProps) => <HostsTableRow {...rowProps} />,
    [],
  );
  return (
    <Table
      {...props}
      defaultSortField="host.metadata.name"
      aria-label="Bare Metal Hosts"
      Header={HostsTableHeader}
      Row={row}
      virtualize
    />
  );
};

export default BareMetalHostsTable;
