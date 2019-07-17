import * as React from 'react';
import { Dashboard, DashboardGrid } from '@console/internal/components/dashboard';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { withDashboardResources } from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { HealthCard } from './health-card';
import { UtilizationCard } from './utilization-card';
import { EventsCard } from './events-card';

export const HostDashboard: React.FC<{ obj: K8sResourceKind }> = ({ obj }) => {
  const ConnectedHealthCard = withDashboardResources(HealthCard, {
    obj,
  });

  const ConnectedUtilizationCard = withDashboardResources(UtilizationCard, {
    obj,
  });

  const ConnectedEventsCard = withDashboardResources(EventsCard, {
    obj,
  });

  const mainCards = [{ Card: ConnectedHealthCard }, { Card: ConnectedUtilizationCard }];
  const leftCards = [];
  const rightCards = [{ Card: ConnectedEventsCard }];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
    </Dashboard>
  );
};
