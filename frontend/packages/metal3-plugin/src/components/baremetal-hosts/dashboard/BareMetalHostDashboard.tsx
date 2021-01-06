import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { getMachineNode } from '@console/shared/src/selectors/machine';
import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { BareMetalHostKind } from '../../../types';
import { findNodeMaintenance, getHostMachine } from '../../../selectors';
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
  nodeMaintenances,
  loaded,
}) => {
  const machine = getHostMachine(obj, machines);
  const node = getMachineNode(machine, nodes);
  const nodeMaintenance = findNodeMaintenance(nodeMaintenances, node?.metadata?.name);
  const context = {
    obj,
    machine,
    node,
    nodeMaintenance,
    loaded,
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
  nodeMaintenances: K8sResourceKind[];
  loaded: boolean;
};

export default BareMetalHostDashboard;
