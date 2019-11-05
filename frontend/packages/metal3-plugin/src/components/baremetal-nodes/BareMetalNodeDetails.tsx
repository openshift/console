import * as React from 'react';
import { NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import NodeDetailsConditions from '@console/app/src/components/nodes/NodeDetailsConditions';
import NodeDetailsImages from '@console/app/src/components/nodes/NodeDetailsImages';
import { getNodeMachineName, getName, createBasicLookup } from '@console/shared';
import { bareMetalNodeStatus } from '../../status/baremetal-node-status';
import { BareMetalHostKind } from '../../types';
import { getNodeMaintenanceNodeName, getHostMachineName } from '../../selectors';
import BareMetalNodeDetailsOverview from './BareMetalNodeDetailsOverview';

type BareMetalNodeDetailsProps = {
  obj: NodeKind;
  hosts: BareMetalHostKind[];
  nodeMaintenances: K8sResourceKind[];
};

const BareMetalNodeDetails: React.FC<BareMetalNodeDetailsProps> = ({
  obj: node,
  hosts,
  nodeMaintenances,
}) => {
  const maintenancesByNodeName = createBasicLookup(nodeMaintenances, getNodeMaintenanceNodeName);
  const hostsByMachineName = createBasicLookup(hosts, getHostMachineName);
  const host = hostsByMachineName[getNodeMachineName(node)];
  const nodeMaintenance = maintenancesByNodeName[getName(node)];
  const status = bareMetalNodeStatus({ node, nodeMaintenance });
  return (
    <>
      <BareMetalNodeDetailsOverview node={node} status={status} host={host} />
      <NodeDetailsConditions node={node} />
      <NodeDetailsImages node={node} />
    </>
  );
};

export default BareMetalNodeDetails;
