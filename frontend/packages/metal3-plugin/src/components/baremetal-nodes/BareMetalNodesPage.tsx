import * as React from 'react';
import { connect } from 'react-redux';
import { referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { MachineModel, NodeModel } from '@console/internal/models';
import * as _ from 'lodash';
import { createLookup, getName, getMachineNodeName } from '@console/shared';
import { MultiListPage } from '@console/internal/components/factory';
import { getNodeMaintenanceNodeName, getHostMachineName } from '../../selectors';
import { BareMetalHostBundle } from '../types';
import { getHostStatus } from '../../utils/host-status';
import { NodeMaintenanceModel, BareMetalHostModel } from '../../models';
import { hostStatusFilter } from '../baremetal-hosts/table-filters';
import BareMetalNodesTable from './BareMetalNodesTable';

const flattenResources = (resources) => {
  // TODO(jtomasek): Remove loaded check once ListPageWrapper_ is updated to call flatten only
  // when resources are loaded
  const loaded = _.every(resources, (resource) =>
    resource.optional ? resource.loaded || !_.isEmpty(resource.loadError) : resource.loaded,
  );
  const {
    hosts,
    machines,
    nodes: { data: nodesData },
    nodeMaintenances,
  } = resources;

  if (loaded) {
    const maintenancesByNodeName = createLookup(nodeMaintenances, getNodeMaintenanceNodeName);
    const hostsByMachineName = createLookup(hosts, getHostMachineName);
    const machinesByNodeName = createLookup(machines, getMachineNodeName);

    return nodesData.map(
      (node): BareMetalHostBundle => {
        const nodeName = getName(node);
        const machine = machinesByNodeName[nodeName];
        const host = hostsByMachineName[getName(machine)];
        const nodeMaintenance = maintenancesByNodeName[nodeName];
        const status = getHostStatus({ host, machine, node, nodeMaintenance });
        // TODO(jtomasek): metadata.name is needed to make 'name' textFilter work.
        // Remove it when it is possible to pass custom textFilter as a function
        return { metadata: { name: nodeName }, host, machine, node, nodeMaintenance, status };
      },
    );
  }
  return [];
};

type BareMetalNodesPageProps = {
  hasNodeMaintenanceCapability: boolean;
};

const BareMetalNodesPage: React.FC<BareMetalNodesPageProps> = ({
  hasNodeMaintenanceCapability,
  ...props
}) => {
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
    <MultiListPage
      {...props}
      rowFilters={[hostStatusFilter]}
      createButtonText="Add Host"
      resources={resources}
      flatten={flattenResources}
      ListComponent={BareMetalNodesTable}
      customData={{ hasNodeMaintenanceCapability }}
      title="Nodes"
    />
  );
};

const mapStateToProps = ({ k8s }) => ({
  hasNodeMaintenanceCapability: !!k8s.getIn([
    'RESOURCES',
    'models',
    referenceForModel(NodeMaintenanceModel),
  ]),
});

export default connect(mapStateToProps)(BareMetalNodesPage);
