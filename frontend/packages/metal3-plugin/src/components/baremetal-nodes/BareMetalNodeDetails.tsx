import * as React from 'react';
import NodeDetailsConditions from '@console/app/src/components/nodes/NodeDetailsConditions';
import NodeDetailsImages from '@console/app/src/components/nodes/NodeDetailsImages';
import { getNodeMachineName, getName, createBasicLookup } from '@console/shared';
import { getNodeMaintenanceNodeName, getHostMachineName } from '../../selectors';
import { getNodeServerCSR } from '../../selectors/csr';
import BareMetalNodeDetailsOverview from './BareMetalNodeDetailsOverview';
import { BareMetalNodeDetailsPageProps } from '../types';

const BareMetalNodeDetails: React.FC<BareMetalNodeDetailsPageProps> = ({
  obj: node,
  hosts,
  nodeMaintenances,
  csrs,
}) => {
  const maintenancesByNodeName = createBasicLookup(nodeMaintenances, getNodeMaintenanceNodeName);
  const hostsByMachineName = createBasicLookup(hosts, getHostMachineName);
  const host = hostsByMachineName[getNodeMachineName(node)];
  const nodeMaintenance = maintenancesByNodeName[getName(node)];
  const csr = getNodeServerCSR(csrs, node);
  return (
    <>
      <BareMetalNodeDetailsOverview
        node={node}
        host={host}
        nodeMaintenance={nodeMaintenance}
        csr={csr}
      />
      <NodeDetailsConditions node={node} />
      <NodeDetailsImages node={node} />
    </>
  );
};

export default BareMetalNodeDetails;
