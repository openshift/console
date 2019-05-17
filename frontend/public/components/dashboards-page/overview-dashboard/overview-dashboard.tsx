import * as React from 'react';

import { Dashboard, DashboardGrid } from '../../dashboard';
import { HealthCard } from './health-card';

export const OverviewDashboard: React.FC<{}> = () => {
  const mainCards = [
    <HealthCard key="health" />,
  ];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} />
    </Dashboard>
  );
};
