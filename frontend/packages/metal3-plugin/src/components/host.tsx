import * as React from 'react';

import { getName, getNamespace } from '@console/shared';
// TODO(jtomasek): update import once models are moved to console-shared package
// import { MachineModel, NodeModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';

import {
  ListHeader,
  ColHead,
  List,
  ListPage,
  ResourceRow,
} from '@console/internal/components/factory';

import { ResourceLink } from '@console/internal/components/utils';
// import { WithResources } from '@console/shared';

import { BaremetalHostModel } from '../models';
import { getHostBMCAddress } from '../selectors';
import MachineCell from './machine-cell';

// const nameColumnClasses = 'col-lg-2 col-md-4 col-sm-6 col-xs-6';
// const statusColumnClasses = 'col-lg-2 col-md-4 hidden-sm hidden-xs';
// const machineColumnClasses = 'col-lg-3 visible-lg';
// const roleColumnClasses = 'col-lg-2 visible-lg';
// const addressColumnClasses = 'col-lg-2 visible-lg';
const columnClasses = 'col-sm-4';

const HostHeader = (props: React.ComponentProps<typeof ColHead>) => (
  <ListHeader>
    <ColHead {...props} className={columnClasses} sortField="metadata.name">
      Name
    </ColHead>
    {/* <ColHead {...props} className={statusColumnClasses}>
      Status
    </ColHead> */}
    <ColHead {...props} className={columnClasses}>
      Machine
    </ColHead>
    {/* <ColHead {...props} className={roleColumnClasses}>
      Role
    </ColHead> */}
    <ColHead {...props} className={columnClasses} sortField="spec.bmc.address">
      Management Address
    </ColHead>
  </ListHeader>
);

const HostRow = ({ obj: host }: React.ComponentProps<typeof ResourceRow>) => {
  const name = getName(host);
  const namespace = getNamespace(host);
  // const machineName = getHostMachineName(host);
  const address = getHostBMCAddress(host);

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
      <div className={columnClasses}>
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
      <div className={columnClasses}>
        <MachineCell host={host} />
      </div>
      {/* <div className={roleColumnClasses}>
        <WithResources resourceMap={machineName ? hostResourceMap : {}}>
          <BaremetalHostRole />
        </WithResources>
      </div> */}
      <div className={columnClasses}>{address}</div>
    </ResourceRow>
  );
};

const HostList = (props: React.ComponentProps<typeof List>) => (
  <List {...props} Header={HostHeader} Row={HostRow} />
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

export const BaremetalHostsPage = (props: BaremetalHostsPageProps) => (
  <ListPage
    {...props}
    canCreate
    rowFilters={filters}
    createButtonText="Add Host"
    kind={referenceForModel(BaremetalHostModel)}
    ListComponent={HostList}
  />
);
