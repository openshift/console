import * as React from 'react';

import { Dashboard, DashboardGrid } from '../../dashboard';
import { HealthCard } from './health-card';
import { DetailsCard } from './details-card';
import { CapacityCard } from './capacity-card';
import { InventoryCard } from './inventory-card';

export const OverviewDashboard: React.FC<{}> = () => {
  const mainCards = [HealthCard, CapacityCard];
  const leftCards = [DetailsCard, InventoryCard];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} />
    </Dashboard>
  );
};
