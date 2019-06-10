import * as React from 'react';
import * as _ from 'lodash-es';

import { getName, getNamespace, getMachineNode } from '@console/shared';
import { MachineModel, NodeModel } from '@console/internal/models';

import {
  ListHeader,
  ColHead,
  List,
  MultiListPage,
  ResourceRow,
} from '@console/internal/components/factory';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';

import { BaremetalHostModel } from '../models';
import { getHostBMCAddress, getHostMachine } from '../selectors';
import { BaremetalHostRole } from './host-role';
import MachineCell from './machine-cell';

const nameColumnClasses = 'col-lg-4 col-md-4 col-sm-6 col-xs-6';
// const statusColumnClasses = 'col-lg-2 col-md-4 hidden-sm hidden-xs';
const machineColumnClasses = 'col-lg-3 visible-lg';
const roleColumnClasses = 'col-lg-2 visible-lg';
const addressColumnClasses = 'col-lg-2 visible-lg';

const HostHeader = (props: React.ComponentProps<typeof ColHead>) => (
  <ListHeader>
    <ColHead {...props} className={nameColumnClasses} sortField="metadata.name">
      Name
    </ColHead>
    {/* <ColHead {...props} className={statusColumnClasses}>
      Status
    </ColHead> */}
    <ColHead {...props} className={machineColumnClasses} sortField="spec.machineRef.name">
      Machine
    </ColHead>
    <ColHead {...props} className={roleColumnClasses}>
      Role
    </ColHead>
    <ColHead {...props} className={addressColumnClasses} sortField="spec.bmc.address">
      Management Address
    </ColHead>
  </ListHeader>
);

type HostRowProps = {
  obj: K8sResourceKind & { machine: K8sResourceKind; node: K8sResourceKind };
  style?: React.StyleHTMLAttributes<any>;
};

const HostRow: React.FC<HostRowProps> = ({ obj: host }) => {
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
    <ResourceRow obj={host}>
      <div className={nameColumnClasses}>
        <ResourceLink
          kind={referenceForModel(BaremetalHostModel)}
          name={name}
          namespace={namespace}
        />
      </div>
      {/* <div className={statusColumnClasses}>
        <WithResources resourceMap={machineName ? hostResourceMap : {}}>
          <BaremetalHostStatus host={host} />
        </WithResources>
      </div> */}
      <div className={machineColumnClasses}>
        <MachineCell host={host} />
      </div>
      <div className={roleColumnClasses}>
        <BaremetalHostRole machine={machine} />
      </div>
      <div className={addressColumnClasses}>{address}</div>
    </ResourceRow>
  );
};

const HostList: React.FC<React.ComponentProps<typeof List>> = (props) => (
  <List {...props} Header={HostHeader} Row={HostRow} virtualize />
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
