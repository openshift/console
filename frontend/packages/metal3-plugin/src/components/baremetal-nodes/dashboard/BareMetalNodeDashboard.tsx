import * as React from 'react';
import ActivityCard from '@console/app/src/components/nodes/node-dashboard/ActivityCard';
import {
  reducer,
  initialState,
  ActionType,
} from '@console/app/src/components/nodes/node-dashboard/NodeDashboard';
import {
  NodeDashboardContext,
  HealthCheck,
} from '@console/app/src/components/nodes/node-dashboard/NodeDashboardContext';
import UtilizationCard from '@console/app/src/components/nodes/node-dashboard/UtilizationCard';
import { createBasicLookup, getNodeMachineName, getName } from '@console/shared';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { LimitRequested } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import { getHostMachineName, getNodeMaintenanceNodeName } from '../../../selectors';
import { getNodeServerCSR } from '../../../selectors/csr';
import { BareMetalNodeDetailsPageProps } from '../../types';
import { BareMetalNodeDashboardContext } from './BareMetalNodeDashboardContext';
import DetailsCard from './DetailsCard';
import InventoryCard from './InventoryCard';
import StatusCard from './StatusCard';

const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
const rightCards = [{ Card: ActivityCard }];

const BareMetalNodeDashboard: React.FC<BareMetalNodeDetailsPageProps> = ({
  obj,
  hosts,
  nodeMaintenances,
  csrs,
}) => {
  const [state, dispatch] = React.useReducer(reducer, initialState(obj));

  if (obj !== state.obj) {
    dispatch({ type: ActionType.OBJ, payload: obj });
  }

  const hostsByMachineName = createBasicLookup(hosts, getHostMachineName);
  const host = hostsByMachineName[getNodeMachineName(obj)];
  const maintenancesByNodeName = createBasicLookup(nodeMaintenances, getNodeMaintenanceNodeName);
  const nodeMaintenance = maintenancesByNodeName[getName(obj)];
  const csr = getNodeServerCSR(csrs, obj);

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
    csr,
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
