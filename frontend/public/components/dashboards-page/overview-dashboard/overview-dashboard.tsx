import * as React from 'react';

import { Dashboard, DashboardGrid } from '../../dashboard';
import { StatusCard } from './status-card';
import { DetailsCard } from './details-card';
import { CapacityCard } from './capacity-card';
import { InventoryCard } from './inventory-card';
import { UtilizationCard } from './utilization-card';
import { TopConsumersCard } from './top-consumers-card';
import { ActivityCard } from './activity-card';

export const OverviewDashboard: React.FC<{}> = () => {
  const mainCards = [{ Card: StatusCard }, { Card: CapacityCard }, { Card: UtilizationCard }];
  const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
  const rightCards = [{ Card: ActivityCard }, { Card: TopConsumersCard }];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
    </Dashboard>
  );
};
