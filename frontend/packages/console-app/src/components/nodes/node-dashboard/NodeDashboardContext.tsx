import * as React from 'react';
import { LimitRequested } from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/utilization-card/UtilizationItem';
import { NodeKind } from '@console/internal/module/k8s';

export const NodeDashboardContext = React.createContext<NodeDashboardContext>({
  setCPULimit: () => {},
  setMemoryLimit: () => {},
  setHealthCheck: () => {},
});

export type HealthCheck = {
  failingHealthCheck: boolean;
  reboot: boolean;
};

type NodeDashboardContext = {
  obj?: NodeKind;
  cpuLimit?: LimitRequested;
  setCPULimit: (state: LimitRequested) => void;
  memoryLimit?: LimitRequested;
  setMemoryLimit: (state: LimitRequested) => void;
  healthCheck?: HealthCheck;
  setHealthCheck: (state: HealthCheck) => void;
};
