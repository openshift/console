import * as React from 'react';

import { Dashboard, DashboardGrid } from '../../dashboard';
import { HealthCard } from './health-card';
import { DetailsCard } from './details-card';
import { CapacityCard } from './capacity-card';

export const OverviewDashboard: React.FC<{}> = () => {
  const mainCards = [HealthCard, CapacityCard];
  const leftCards = [DetailsCard];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} />
    </Dashboard>
  );
};
