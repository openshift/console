import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { MachineModel, NodeModel } from '@console/internal/models';
import { createLookup, getName, getMachineNodeName } from '@console/shared';
import { MultiListPage } from '@console/internal/components/factory';
import { useFlag } from '@console/shared/src/hooks/flag';
import { getNodeMaintenanceNodeName, getHostMachineName } from '../../selectors';
import { BareMetalNodeBundle } from '../types';
import { NodeMaintenanceModel, BareMetalHostModel } from '../../models';
import { bareMetalNodeStatus } from '../../status/baremetal-node-status';
import BareMetalNodesTable from './BareMetalNodesTable';
import { bareMetalNodeStatusFilter } from './table-filters';
import { NODE_MAINTENANCE_FLAG } from '../../features';

const flattenResources = (resources) => {
  // TODO(jtomasek): Remove loaded check once ListPageWrapper_ is updated to call flatten only
  // when resources are loaded
  const loaded = _.every(
    resources,
    (resource) => resource.loaded || (resource.optional && !_.isEmpty(resource.loadError)),
  );
  const {
    hosts,
    machines,
    nodes: { data: nodesData },
    nodeMaintenances,
  } = resources;

  if (!loaded) return [];

  const maintenancesByNodeName = createLookup(nodeMaintenances, getNodeMaintenanceNodeName);
  const hostsByMachineName = createLookup(hosts, getHostMachineName);
  const machinesByNodeName = createLookup(machines, getMachineNodeName);

  return nodesData.map(
    (node): BareMetalNodeBundle => {
      const nodeName = getName(node);
      const machine = machinesByNodeName[nodeName];
      const host = hostsByMachineName[getName(machine)];
      const nodeMaintenance = maintenancesByNodeName[nodeName];
      const status = bareMetalNodeStatus({ node, nodeMaintenance });
      // TODO(jtomasek): metadata.name is needed to make 'name' textFilter work.
      // Remove it when it is possible to pass custom textFilter as a function
      return { metadata: { name: nodeName }, host, machine, node, nodeMaintenance, status };
    },
  );
};

const BareMetalNodesPage: React.FC = (props) => {
  const hasNodeMaintenanceCapability = useFlag(NODE_MAINTENANCE_FLAG);
  const resources: FirehoseResource[] = [
    {
      kind: referenceForModel(BareMetalHostModel),
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
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  return (
    <div className="co-m-list">
      <Helmet>
        <title>Nodes</title>
      </Helmet>
      <MultiListPage
        {...props}
        rowFilters={[bareMetalNodeStatusFilter]}
        createButtonText="Add Host"
        resources={resources}
        flatten={flattenResources}
        ListComponent={BareMetalNodesTable}
        title="Nodes"
      />
    </div>
  );
};

export default BareMetalNodesPage;
