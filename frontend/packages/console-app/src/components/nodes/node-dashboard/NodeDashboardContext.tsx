import { createContext } from 'react';
import type { NodeKind } from '@console/internal/module/k8s';
import type { LimitRequested } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';

export const NodeDashboardContext = createContext<NodeDashboardContext>({
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
