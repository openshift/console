import * as React from 'react';

import { Dashboard, DashboardGrid } from '../../dashboard';
import { HealthCard } from './health-card';
import { CapacityCard } from './capacity-card';

export const OverviewDashboard: React.FC<{}> = () => {
  const mainCards = [
    <HealthCard key="health" />,
    <CapacityCard key="capacity" />,
  ];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} />
    </Dashboard>
  );
};
