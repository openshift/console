import * as React from 'react';
import * as _ from 'lodash';
import Helmet from 'react-helmet';
import { referenceForModel, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils';
import { MachineModel, NodeModel, CertificateSigningRequestModel } from '@console/internal/models';
import { createLookup, getName, getMachineNodeName } from '@console/shared';
import { MultiListPage } from '@console/internal/components/factory';
import { useFlag } from '@console/shared/src/hooks/flag';
import { getNodeMaintenanceNodeName, getHostMachineName } from '../../selectors';
import { getNodeServerCSR, getNodeClientCSRs } from '../../selectors/csr';
import { BareMetalNodeListBundle, BareMetalNodeBundle } from '../types';
import { NodeMaintenanceModel, BareMetalHostModel } from '../../models';
import { bareMetalNodeStatus } from '../../status/baremetal-node-status';
import BareMetalNodesTable from './BareMetalNodesTable';
import { bareMetalNodeStatusFilter } from './table-filters';
import { NODE_MAINTENANCE_FLAG } from '../../features';
import { BareMetalHostKind, CertificateSigningRequestKind } from '../../types';

const flattenResources = (resources: {
  hosts: FirehoseResult<BareMetalHostKind[]>;
  machines: FirehoseResult<MachineKind[]>;
  nodes: FirehoseResult<NodeKind[]>;
  nodeMaintenances?: FirehoseResult;
  csrs: FirehoseResult<CertificateSigningRequestKind[]>;
}): BareMetalNodeListBundle[] => {
  // TODO(jtomasek): Remove loaded check once ListPageWrapper_ is updated to call flatten only
  // when resources are loaded
  const loaded = _.every(
    resources,
    (resource) => resource.loaded || (resource.optional && !_.isEmpty(resource.loadError)),
  );
  if (!loaded) return [];

  const { hosts, machines, nodes, nodeMaintenances, csrs } = resources;

  const maintenancesByNodeName = createLookup(nodeMaintenances, getNodeMaintenanceNodeName);
  const hostsByMachineName = createLookup(hosts, getHostMachineName);
  const machinesByNodeName = createLookup(machines, getMachineNodeName);

  const nodeBundle: BareMetalNodeBundle[] = nodes?.data?.map((node) => {
    const nodeName = getName(node);
    const machine = machinesByNodeName[nodeName];
    const host = hostsByMachineName[getName(machine)];
    const nodeMaintenance = maintenancesByNodeName[nodeName];
    const csr = getNodeServerCSR(csrs.data, node);
    const status = bareMetalNodeStatus({ node, nodeMaintenance, csr });
    // TODO(jtomasek): name is needed to make 'name' textFilter work.
    // Remove it when it is possible to pass custom textFilter as a function
    return { metadata: { name: nodeName }, host, machine, node, nodeMaintenance, status, csr };
  });
  const csrBundle = getNodeClientCSRs(csrs.data);
  return [...csrBundle, ...nodeBundle];
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
    {
      kind: CertificateSigningRequestModel.kind,
      namespaced: false,
      prop: 'csrs',
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
        resources={resources}
        flatten={flattenResources}
        ListComponent={BareMetalNodesTable}
        title="Nodes"
      />
    </div>
  );
};

export default BareMetalNodesPage;
