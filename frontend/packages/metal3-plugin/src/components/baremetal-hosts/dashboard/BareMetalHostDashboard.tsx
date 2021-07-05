import * as React from 'react';
import Dashboard from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/Dashboard';
import DashboardGrid from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/DashboardGrid';
import { getMachineNode } from '@console/dynamic-plugin-sdk/src/shared/selectors/machine';
import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { findNodeMaintenance, getHostMachine } from '../../../selectors';
import { BareMetalHostKind } from '../../../types';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';
import DetailsCard from './DetailsCard';
import EventsCard from './EventsCard';
import InventoryCard from './InventoryCard';
import StatusCard from './StatusCard';
import UtilizationCard from './UtilizationCard';

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
