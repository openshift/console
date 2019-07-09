import * as React from 'react';
import { Dashboard, DashboardGrid } from '@console/internal/components/dashboard';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { withDashboardResources } from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { HealthCard } from './health-card';

export const HostDashboard: React.FC<{ obj: K8sResourceKind }> = ({ obj }) => {
  const ConnectedHealthCard = withDashboardResources(HealthCard, {
    obj,
  });

  const mainCards = [ConnectedHealthCard];
  const leftCards = [];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} />
    </Dashboard>
  );
};
