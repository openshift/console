import { createContext } from 'react';
import type { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import type { BareMetalHostKind } from '../../../types';

export const BareMetalHostDashboardContext = createContext<BareMetalDashboardContext>({});

type BareMetalDashboardContext = {
  obj?: BareMetalHostKind;
  machine?: MachineKind;
  node?: NodeKind;
  nodeMaintenance?: K8sResourceKind;
  loaded?: boolean;
};
