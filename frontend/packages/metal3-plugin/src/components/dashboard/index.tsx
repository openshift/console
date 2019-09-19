import * as React from 'react';
import { Dashboard, DashboardGrid } from '@console/internal/components/dashboard';
import { K8sResourceKind, MachineKind } from '@console/internal/module/k8s';
import HealthCard from './health-card';
import UtilizationCard from './utilization-card';
import EventsCard from './events-card';
import InventoryCard from './inventory-card';
import DetailsCard from './details-card';

export const HostDashboard: React.FC<HostDashboardProps> = ({ obj, machines }) => {
  const mainCards = [
    { Card: () => <HealthCard obj={obj} /> },
    { Card: () => <UtilizationCard obj={obj} /> },
  ];
  const leftCards = [
    {
      Card: () => <DetailsCard obj={obj} machines={machines} />,
    },
    { Card: () => <InventoryCard obj={obj} /> },
  ];
  const rightCards = [{ Card: () => <EventsCard obj={obj} /> }];

  return (
    <Dashboard>
      <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
    </Dashboard>
  );
};

type HostDashboardProps = {
  obj: K8sResourceKind;
  machines: MachineKind[];
};
