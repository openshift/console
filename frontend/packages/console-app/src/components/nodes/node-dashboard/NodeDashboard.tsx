import * as React from 'react';
import * as _ from 'lodash';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardGrid from '@console/shared/src/components/dashboard/DashboardGrid';
import { NodeKind } from '@console/internal/module/k8s';
import { LimitRequested } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';

import { NodeDashboardContext } from './NodeDashboardContext';
import InventoryCard from './InventoryCard';
import DetailsCard from './DetailsCard';
import StatusCard from './StatusCard';
import ActivityCard from './ActivityCard';
import UtilizationCard from './UtilizationCard';

const leftCards = [{ Card: DetailsCard }, { Card: InventoryCard }];
const mainCards = [{ Card: StatusCard }, { Card: UtilizationCard }];
const rightCards = [{ Card: ActivityCard }];

export enum ActionType {
  CPU_LIMIT = 'CPU_LIMIT',
  MEMORY_LIMIT = 'MEMORY_LIMIT',
  HEALTH_CHECK = 'HEALTH_CHECK',
  OBJ = 'OBJ',
}

export const initialState = (obj: NodeKind): NodeDashboardState => ({
  obj,
  cpuLimit: undefined,
  memoryLimit: undefined,
  healthCheck: undefined,
});

export const reducer = (state: NodeDashboardState, action: NodeDashboardAction) => {
  switch (action.type) {
    case ActionType.CPU_LIMIT: {
      if (_.isEqual(action.payload, state.cpuLimit)) {
        return state;
      }
      return {
        ...state,
        cpuLimit: action.payload,
      };
    }
    case ActionType.MEMORY_LIMIT: {
      if (_.isEqual(action.payload, state.memoryLimit)) {
        return state;
      }
      return {
        ...state,
        memoryLimit: action.payload,
      };
    }
    case ActionType.HEALTH_CHECK: {
      if (action.payload === state.healthCheck) {
        return state;
      }
      return {
        ...state,
        healthCheck: action.payload,
      };
    }
    case ActionType.OBJ: {
      if (action.payload === state.obj) {
        return state;
      }
      return {
        ...state,
        obj: action.payload,
      };
    }
    default:
      return state;
  }
};

const NodeDashboard: React.FC<NodeDashboardProps> = ({ obj }) => {
  const [state, dispatch] = React.useReducer(reducer, initialState(obj));

  if (obj !== state.obj) {
    dispatch({ type: ActionType.OBJ, payload: obj });
  }

  const setCPULimit = React.useCallback(
    (payload: LimitRequested) => dispatch({ type: ActionType.CPU_LIMIT, payload }),
    [],
  );
  const setMemoryLimit = React.useCallback(
    (payload: LimitRequested) => dispatch({ type: ActionType.MEMORY_LIMIT, payload }),
    [],
  );
  const setHealthCheck = React.useCallback(
    (payload: boolean) => dispatch({ type: ActionType.HEALTH_CHECK, payload }),
    [],
  );

  const context = {
    obj,
    cpuLimit: state.cpuLimit,
    memoryLimit: state.memoryLimit,
    healthCheck: state.healthCheck,
    setCPULimit,
    setMemoryLimit,
    setHealthCheck,
  };

  return (
    <NodeDashboardContext.Provider value={context}>
      <Dashboard>
        <DashboardGrid mainCards={mainCards} leftCards={leftCards} rightCards={rightCards} />
      </Dashboard>
    </NodeDashboardContext.Provider>
  );
};

export default NodeDashboard;

type NodeDashboardProps = {
  obj: NodeKind;
};

type NodeDashboardState = {
  obj: NodeKind;
  cpuLimit: LimitRequested;
  memoryLimit: LimitRequested;
  healthCheck: boolean;
};

type NodeDashboardAction =
  | { type: ActionType.CPU_LIMIT; payload: LimitRequested }
  | { type: ActionType.MEMORY_LIMIT; payload: LimitRequested }
  | { type: ActionType.HEALTH_CHECK; payload: boolean }
  | { type: ActionType.OBJ; payload: NodeKind };
