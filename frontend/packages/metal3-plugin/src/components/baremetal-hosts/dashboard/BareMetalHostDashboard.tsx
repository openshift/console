import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { BareMetalHostKind } from '../../../types';
import { getHostMachine } from '../../../selectors';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';
import StatusCard from './StatusCard';
import UtilizationCard from './UtilizationCard';
import EventsCard from './EventsCard';
import InventoryCard from './InventoryCard';
import DetailsCard from './DetailsCard';

const BareMetalHostDashboard: React.FC<BareMetalHostDashboardProps> = ({
  obj,
  machines,
  nodes,
}) => {
  const machine = getHostMachine(obj, machines);
  const context = {
    obj,
    machine,
    machines,
    nodes,
  };

  const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
  const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
  const rightCards = [{ Card: EventsCard }];

  return (
    <BareMetalHostDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
      </Dashboard>
    </BareMetalHostDashboardContext.Provider>
  );
};

type BareMetalHostDashboardProps = {
  obj: BareMetalHostKind;
  machines: MachineKind[];
  nodes: NodeKind[];
};

export default BareMetalHostDashboard;
