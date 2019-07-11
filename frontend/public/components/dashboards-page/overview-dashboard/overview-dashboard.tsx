import * as React from 'react';

import { Dashboard, DashboardGrid } from '../../dashboard';
import { HealthCard } from './health-card';
import { DetailsCard } from './details-card';
import { CapacityCard } from './capacity-card';
import { InventoryCard } from './inventory-card';
import { EventsCard } from './events-card';
import { UtilizationCard } from './utilization-card';

export const OverviewDashboard: React.FC<{}> = () => {
  const mainCards = [HealthCard, CapacityCard, UtilizationCard];
  const leftCards = [DetailsCard, InventoryCard];
  const rightCards = [EventsCard];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
    </Dashboard>
  );
};
