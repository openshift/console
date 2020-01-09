import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { getName, createLookup, getNodeMachineName } from '@console/shared';
import { MachineModel, NodeModel } from '@console/internal/models';
import { MultiListPage } from '@console/internal/components/factory';
import { FirehoseResource } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { BareMetalHostModel, NodeMaintenanceModel } from '../../models';
import { getHostMachine, getNodeMaintenanceNodeName } from '../../selectors';
import { getHostStatus } from '../../status/host-status';
import { BareMetalHostBundle } from '../types';
import { hostStatusFilter } from './table-filters';
import BareMetalHostsTable from './BareMetalHostsTable';

const flattenResources = (resources) => {
  // TODO(jtomasek): Remove loaded check once ListPageWrapper_ is updated to call flatten only
  // when resources are loaded
  const loaded = _.every(resources, (resource) =>
    resource.optional ? resource.loaded || !_.isEmpty(resource.loadError) : resource.loaded,
  );
  const {
    hosts: { data: hostsData },
    machines: { data: machinesData },
    nodes,
    nodeMaintenances,
  } = resources;

  if (loaded) {
    const maintenancesByNodeName = createLookup(nodeMaintenances, getNodeMaintenanceNodeName);
    const nodesByMachineName = createLookup(nodes, getNodeMachineName);

    return hostsData.map(
      (host): BareMetalHostBundle => {
        // TODO(jtomasek): replace this with createLookup once there is metal3.io/BareMetalHost annotation
        // on machines
        const machine = getHostMachine(host, machinesData);
        const node = nodesByMachineName[getName(machine)];
        const nodeMaintenance = maintenancesByNodeName[getName(node)];
        const status = getHostStatus({ host, machine, node, nodeMaintenance });
        // TODO(jtomasek): metadata.name is needed to make 'name' textFilter work.
        // Remove it when it is possible to pass custom textFilter as a function
        return { metadata: { name: getName(host) }, host, machine, node, nodeMaintenance, status };
      },
    );
  }
  return [];
};

type BareMetalHostsPageProps = {
  namespace: string;
  hasNodeMaintenanceCapability: boolean;
};

const getCreateProps = ({ namespace }: { namespace: string }) => {
  const items: any = {
    dialog: 'New with Dialog',
    yaml: 'New from YAML',
  };

  return {
    items,
    createLink: (itemName) => {
      const base = `/k8s/ns/${namespace || 'default'}/${referenceForModel(BareMetalHostModel)}`;

      switch (itemName) {
        case 'dialog':
          return `${base}/~new/form`;
        case 'yaml':
        default:
          return `${base}/~new`;
      }
    },
  };
};

const BareMetalHostsPage: React.FC<BareMetalHostsPageProps> = ({
  hasNodeMaintenanceCapability,
  ...props
}) => {
  const { namespace } = props;
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
      isList: true,
      prop: 'nodeMaintenances',
      optional: true,
    });
  }

  return (
    <MultiListPage
      {...props}
      canCreate
      rowFilters={[hostStatusFilter]}
      createProps={getCreateProps({ namespace })}
      createButtonText="Add Host"
      namespace={namespace}
      resources={resources}
      flatten={flattenResources}
      ListComponent={BareMetalHostsTable}
      customData={{ hasNodeMaintenanceCapability }}
      title="Bare Metal Hosts"
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

export default connect(mapStateToProps)(BareMetalHostsPage);
