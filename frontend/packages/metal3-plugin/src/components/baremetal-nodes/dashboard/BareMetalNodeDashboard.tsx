import * as React from 'react';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import UtilizationCard from '@console/app/src/components/nodes/node-dashboard/UtilizationCard';
import ActivityCard from '@console/app/src/components/nodes/node-dashboard/ActivityCard';
import {
  NodeDashboardContext,
  HealthCheck,
} from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import {
  reducer,
  initialState,
  ActionType,
} from '@console/app/src/components/nodes/node-dashboard/NodeDashboard';
import { createBasicLookup, getNodeMachineName, getName } from '@console/shared';
import { LimitRequested } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';

import InventoryCard from './InventoryCard';
import DetailsCard from './DetailsCard';
import StatusCard from './StatusCard';
import { BareMetalHostKind } from '../../../types';
import { getHostMachineName, getNodeMaintenanceNodeName } from '../../../selectors';
import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';

const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
const rightCards = [{ Card: ActivityCard }];

const BareMetalNodeDashboard: React.FC<BareMetalNodeDashboardProps> = ({
  obj,
  hosts,
  nodeMaintenances,
}) => {
  const [state, dispatch] = React.useReducer(reducer, initialState(obj));

  if (obj !== state.obj) {
    dispatch({ type: ActionType.OBJ, payload: obj });
  }

  const hostsByMachineName = createBasicLookup(hosts, getHostMachineName);
  const host = hostsByMachineName[getNodeMachineName(obj)];
  const maintenancesByNodeName = createBasicLookup(nodeMaintenances, getNodeMaintenanceNodeName);
  const nodeMaintenance = maintenancesByNodeName[getName(obj)];

  const setCPULimit = React.useCallback(
    (payload: LimitRequested) => dispatch({ type: ActionType.CPU_LIMIT, payload }),
    [],
  );
  const setMemoryLimit = React.useCallback(
    (payload: LimitRequested) => dispatch({ type: ActionType.MEMORY_LIMIT, payload }),
    [],
  );
  const setHealthCheck = React.useCallback(
    (payload: HealthCheck) => dispatch({ type: ActionType.HEALTH_CHECK, payload }),
    [],
  );

  const context = {
    obj,
    cpuLimit: state.cpuLimit,
    memoryLimit: state.memoryLimit,
    setCPULimit,
    setMemoryLimit,
    setHealthCheck,
  };

  const bmnContext = {
    host,
    nodeMaintenance,
  };

  return (
    <NodeDashboardContext.Provider value={context}>
      <BareMetalNodeDashboardContext.Provider value={bmnContext}>
        <Dashboard>
          <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
        </Dashboard>
      </BareMetalNodeDashboardContext.Provider>
    </NodeDashboardContext.Provider>
  );
};

export default BareMetalNodeDashboard;

type BareMetalNodeDashboardProps = {
  obj: NodeKind;
  hosts: BareMetalHostKind[];
  nodeMaintenances: K8sResourceKind[];
};
