import * as React from 'react';

import { Dashboard, DashboardGrid } from '../../dashboard';
import { HealthCard } from './health-card';
import { DetailsCard } from './details-card';

export const OverviewDashboard: React.FC<{}> = () => {
  const mainCards = [
    <HealthCard key="health" />,
  ];

  const leftCards = [
    <DetailsCard key="details" />,
  ];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} />
    </Dashboard>
  );
};
