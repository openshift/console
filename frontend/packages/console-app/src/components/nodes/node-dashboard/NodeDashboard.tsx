import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { NodeKind } from '@console/internal/module/k8s';

import { NodeDashboardContext } from './NodeDashboardContext';
import InventoryCard from './InventoryCard';
import DetailsCard from './DetailsCard';
import StatusCard from './StatusCard';
import ActivityCard from './ActivityCard';
import UtilizationCard from './UtilizationCard';

const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
const rightCards = [{ Card: ActivityCard }];

const NodeDashboard: React.FC<NodeDashboardProps> = ({ obj }) => {
  const context = {
    obj,
  };

  return (
    <NodeDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
      </Dashboard>
    </NodeDashboardContext.Provider>
  );
};

export default NodeDashboard;

type NodeDashboardProps = {
  obj: NodeKind;
};
