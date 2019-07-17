import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { getName, getNamespace, getUID, getMachineNode, createLookup } from '@console/shared';
import { MachineModel, NodeModel } from '@console/internal/models';
import { MultiListPage, Table, TableRow, TableData } from '@console/internal/components/factory';
import { Kebab, ResourceLink, FirehoseResource } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';

import { BaremetalHostModel, NodeMaintenanceModel } from '../models';
import { getHostBMCAddress, getHostMachine, getNodeMaintenanceNodeName } from '../selectors';
import { BaremetalHostRole } from './host-role';
import MachineCell from './machine-cell';
import BaremetalHostStatus from './host-status';
import { hostStatusFilter } from './table-filters';
import { menuActions } from './host-menu-actions';
import { getHostStatus } from '../utils/host-status';
import { HostRowBundle } from './types';

const tableColumnClasses = [
  classNames('col-lg-3', 'col-md-4', 'col-sm-12', 'col-xs-12'),
  classNames('col-lg-2', 'col-md-4', 'col-sm-6', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const HostsTableHeader = () => [
  {
    title: 'Name',
    sortField: 'host.metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Status',
    sortField: 'status.status',
    transforms: [sortable],
    props: { className: tableColumnClasses[1] },
  },
  {
    title: 'Machine',
    sortField: 'host.spec.consumerRef.name',
    transforms: [sortable],
    props: { className: tableColumnClasses[2] },
  },
  {
    title: 'Role',
    sortField: 'machine.metadata.labels["machine.openshift.io/cluster-api-machine-role"]',
    transforms: [sortable],
    props: { className: tableColumnClasses[3] },
  },
  {
    title: 'Management Address',
    sortField: 'host.spec.bmc.address',
    transforms: [sortable],
    props: { className: tableColumnClasses[4] },
  },
  {
    title: '',
    props: { className: tableColumnClasses[5] },
  },
];

type HostsTableRowProps = {
  obj: HostRowBundle;
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
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(BaremetalHostModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[1]}>
        <BaremetalHostStatus host={host} status={status} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <MachineCell host={host} status={status} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <BaremetalHostRole machine={machine} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{address}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <Kebab
          options={menuActions.map((action) =>
            action(BaremetalHostModel, host, null, {
              nodeMaintenance,
              nodeName,
              hasNodeMaintenanceCapability,
            }),
          )}
          key={`kebab-for-${uid}`}
          id={`kebab-for-${uid}`}
        />
      </TableData>
    </TableRow>
  );
};

const HostList: React.FC<HostListProps> = (props) => (
  <Table {...props} aria-label="Baremetal Hosts" Header={HostsTableHeader} Row={HostsTableRow} />
);

type HostListProps = React.ComponentProps<typeof Table> & {
  data: HostRowBundle[];
  customData: {
    hasNodeMaintenanceCapability: boolean;
  };
};

const BaremetalHostsPage: React.FC<BaremetalHostsPageProps> = ({
  hasNodeMaintenanceCapability,
  ...props
}) => {
  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(BaremetalHostModel),
      namespaced: true,
      prop: 'hosts',
    },
    {
      kind: referenceForModel(MachineModel),
      namespaced: true,
      prop: 'machines',
    },
    {
      kind: NodeModel.kind,
      namespaced: false,
      prop: 'nodes',
    },
  ];

  if (hasNodeMaintenanceCapability) {
    resources.push({
      kind: referenceForModel(NodeMaintenanceModel),
      namespaced: false,
      isList: true,
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  const flatten = (fResources) => {
    // TODO(jtomasek): Remove loaded check once ListPageWrapper_ is updated to call flatten only
    // when resources are loaded
    const loaded = _.every(fResources, (resource) =>
      resource.optional ? resource.loaded || !_.isEmpty(resource.loadError) : resource.loaded,
    );
    const {
      hosts: { data: hostsData },
      machines: { data: machinesData },
      nodes: { data: nodesData },
      nodeMaintenances,
    } = fResources;

    if (loaded) {
      const nodeMaintenanceLookup = createLookup(nodeMaintenances, getNodeMaintenanceNodeName);

      return hostsData.map((host) => {
        const machine = getHostMachine(host, machinesData);
        const node = getMachineNode(machine, nodesData);
        const nodeMaintenance = nodeMaintenanceLookup[getName(node)];
        return {
          ...host,
          host,
          machine,
          node,
          nodeMaintenance,
          status: getHostStatus({ host, machine, node, nodeMaintenance }),
        };
      });
    }
    return [];
  };

  return (
    <MultiListPage
      {...props}
      canCreate
      rowFilters={[hostStatusFilter]}
      createButtonText="Add Host"
      namespace={props.namespace}
      resources={resources}
      flatten={flatten}
      ListComponent={HostList}
      customData={{ hasNodeMaintenanceCapability }}
    />
  );
};

type BaremetalHostsPageProps = {
  namespace: string;
  hasNodeMaintenanceCapability: boolean;
};

const hostsPageStateToProps = ({ k8s }) => ({
  hasNodeMaintenanceCapability: !!k8s.getIn([
    'RESOURCES',
    'models',
    referenceForModel(NodeMaintenanceModel),
  ]),
});

export const BaremetalHostsPageConnected = connect(hostsPageStateToProps)(BaremetalHostsPage);
