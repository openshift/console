import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { getName, getNamespace, getMachineNode } from '@console/shared';
import { MachineModel, NodeModel } from '@console/internal/models';

import { MultiListPage, Table, TableRow, TableData } from '@console/internal/components/factory';
import { ResourceLink, Kebab } from '@console/internal/components/utils';
import {
  referenceForModel,
  K8sResourceKind,
  MachineKind,
  NodeKind,
} from '@console/internal/module/k8s';

import { BaremetalHostModel } from '../models';
import { getHostBMCAddress, getHostMachine } from '../selectors';
import { BaremetalHostRole } from './host-role';
import MachineCell from './machine-cell';

const tableColumnClasses = [
  classNames('col-lg-5', 'col-md-8', 'col-sm-12', 'col-xs-12'),
  classNames('col-lg-2', 'col-md-4', 'col-sm-6', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-4', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const HostsTableHeader = () => [
  {
    title: 'Name',
    sortField: 'metadata.name',
    transforms: [sortable],
    props: { className: tableColumnClasses[0] },
  },
  {
    title: 'Machine',
    sortField: 'spec.machineRef.name',
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
    sortField: 'spec.machineRef.name',
    transforms: [sortable],
    props: { className: tableColumnClasses[4] },
  },
  // {
  //   title: '',
  //   props: { className: tableColumnClasses[5] },
  // },
];

type HostsTableRowProps = {
  obj: K8sResourceKind & { machine: MachineKind; node: NodeKind };
  index: number;
  key?: string;
  style: React.StyleHTMLAttributes<any>;
};

const HostsTableRow: React.FC<HostsTableRowProps> = ({ obj: host, index, key, style }) => {
  const name = getName(host);
  const namespace = getNamespace(host);
  // const machineName = getHostMachineName(host);
  const address = getHostBMCAddress(host);
  const { machine } = host;

  // TODO(jtomasek): other resource references will be updated as a subsequent change
  // const machineResource = {
  //   kind: referenceForModel(MachineModel),
  //   name: machineName,
  //   namespaced: true,
  //   namespace,
  //   isList: false,
  //   prop: 'machine',
  // };

  // const hostResourceMap = {
  //   machine: {
  //     resource: machineResource,
  //   },
  //   nodes: {
  //     resource: getResource(NodeModel, { namespaced: false }),
  //   },
  // };

  return (
    <TableRow id={host.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceForModel(BaremetalHostModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      {/* <TableData className={tableColumnClasses[0]}>
           <BaremetalHostStatus host={host} />
       </TableData> */}
      <TableData className={tableColumnClasses[2]}>
        <MachineCell host={host} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <BaremetalHostRole machine={machine} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{address}</TableData>
      {/* <TableData className={tableColumnClasses[5]}>
        TODO(jtomasek): Add host actions here
      </TableData> */}
    </TableRow>
  );
};

const HostList: React.FC<React.ComponentProps<typeof Table>> = (props) => (
  <Table
    {...props}
    aria-label="Baremetal Hosts"
    Header={HostsTableHeader}
    Row={HostsTableRow}
    virtualize
  />
);

// TODO(jtomasek): re-enable filters once the extension point for list.tsx is in place
const filters = [];
// const filters = [
//   {
//     type: 'baremetalhost-status',
//     selected: ['online', 'offline'],
//     reducer: getSimpleHostStatus,
//     items: [{ id: 'online', title: 'online' }, { id: 'offline', title: 'offline' }],
//   },
// ];

type BaremetalHostsPageProps = {
  namespace: string;
};

export const BaremetalHostsPage: React.FC<BaremetalHostsPageProps> = (props) => {
  const hostsResource = {
    kind: referenceForModel(BaremetalHostModel),
    namespaced: true,
    prop: 'hosts',
  };
  const machinesResource = {
    kind: referenceForModel(MachineModel),
    namespaced: true,
    prop: 'machines',
  };
  const nodesResource = {
    kind: NodeModel.kind,
    namespaced: false,
    prop: 'nodes',
  };

  const flatten = (resources) => {
    // TODO(jtomasek): Remove loaded check once ListPageWrapper_ is updated to call flatten only
    // when resources are loaded
    const loaded = _.every(resources, (resource) =>
      resource.optional ? resource.loaded || !_.isEmpty(resource.loadError) : resource.loaded,
    );
    const {
      hosts: { data: hostsData },
      machines: { data: machinesData },
      nodes: { data: nodesData },
    } = resources;

    if (loaded) {
      return hostsData.map((host) => {
        const machine = getHostMachine(host, machinesData);
        const node = getMachineNode(machine, nodesData);
        return { ...host, machine, node };
      });
    }
    return [];
  };

  return (
    <MultiListPage
      {...props}
      canCreate
      rowFilters={filters}
      createButtonText="Add Host"
      namespace={props.namespace}
      resources={[hostsResource, machinesResource, nodesResource]}
      flatten={flatten}
      ListComponent={HostList}
    />
  );
};
