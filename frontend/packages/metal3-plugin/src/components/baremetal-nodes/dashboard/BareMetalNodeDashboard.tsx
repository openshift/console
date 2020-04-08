import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import UtilizationCard from '@console/app/src/components/nodes/node-dashboard/UtilizationCard';
import ActivityCard from '@console/app/src/components/nodes/node-dashboard/ActivityCard';
import { NodeDashboardContext } from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import { createBasicLookup, getNodeMachineName, getName } from '@console/shared';

import InventoryCard from './InventoryCard';
import DetailsCard from './DetailsCard';
import StatusCard from './StatusCard';
import { BareMetalHostKind } from '../../../types';
import { getHostMachineName, getNodeMaintenanceNodeName } from '../../../selectors';
import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';

const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
const rightCards = [{ Card: ActivityCard }];

const BareMetalNodeDashboard: React.FC<BareMetalNodeDashboardProps> = ({
  obj,
  hosts,
  nodeMaintenances,
}) => {
  const hostsByMachineName = createBasicLookup(hosts, getHostMachineName);
  const host = hostsByMachineName[getNodeMachineName(obj)];
  const maintenancesByNodeName = createBasicLookup(nodeMaintenances, getNodeMaintenanceNodeName);
  const nodeMaintenance = maintenancesByNodeName[getName(obj)];

  const context = {
    obj,
  };

  const bmnContext = {
    host,
    nodeMaintenance,
  };

  return (
    <NodeDashboardContext.Provider value={context}>
      <BareMetalNodeDashboardContext.Provider value={bmnContext}>
        <Dashboard>
          <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
        </Dashboard>
      </BareMetalNodeDashboardContext.Provider>
    </NodeDashboardContext.Provider>
  );
};

export default BareMetalNodeDashboard;

type BareMetalNodeDashboardProps = {
  obj: NodeKind;
  hosts: BareMetalHostKind[];
  nodeMaintenances: K8sResourceKind[];
};
