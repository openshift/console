import * as React from 'react';

import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { StatusCard } from './status-card';
import { DetailsCard } from './details-card';
import { InventoryCard } from './inventory-card';
import { UtilizationCard } from './utilization-card';
import { ActivityCard } from './activity-card';

export const ClusterDashboard: React.FC<{}> = () => {
  const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
  const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
  const rightCards = [{ Card: ActivityCard }];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
    </Dashboard>
  );
};
