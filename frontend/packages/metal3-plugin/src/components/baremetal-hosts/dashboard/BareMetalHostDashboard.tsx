import * as React from 'react';
import { Dashboard, DashboardGrid } from '@console/internal/components/dashboard';
import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import HealthCard from './HealthCard';
import UtilizationCard from './UtilizationCard';
import EventsCard from './EventsCard';
import InventoryCard from './InventoryCard';
import DetailsCard from './DetailsCard';

const BareMetalHostDashboard: React.FC<BareMetalHostDashboardProps> = ({
  obj,
  machines,
  nodes,
}) => {
  const mainCards = [
    { Card: () => <HealthCard obj={obj} /> },
    { Card: () => <UtilizationCard obj={obj} /> },
  ];
  const leftCards = [
    {
      Card: () => <DetailsCard obj={obj} machines={machines} nodes={nodes} />,
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

type BareMetalHostDashboardProps = {
  obj: K8sResourceKind;
  machines: MachineKind[];
  nodes: NodeKind[];
};

export default BareMetalHostDashboard;
