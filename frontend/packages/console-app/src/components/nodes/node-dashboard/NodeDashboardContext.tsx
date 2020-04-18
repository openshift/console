import * as React from 'react';
import { NodeKind } from '@console/internal/module/k8s';
import { LimitRequested } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';

export const NodeDashboardContext = React.createContext<NodeDashboardContext>({
  setCPULimit: () => {},
  setMemoryLimit: () => {},
  setHealthCheck: () => {},
});

type NodeDashboardContext = {
  obj?: NodeKind;
  cpuLimit?: LimitRequested;
  setCPULimit: (state: LimitRequested) => void;
  memoryLimit?: LimitRequested;
  setMemoryLimit: (state: LimitRequested) => void;
  healthCheck?: boolean;
  setHealthCheck: (state: boolean) => void;
};
