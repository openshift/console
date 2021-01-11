import * as React from 'react';
import { K8sResourceKind, MachineKind, NodeKind } from '@console/internal/module/k8s';
import { BareMetalHostKind } from '../../../types';

export const BareMetalHostDashboardContext = React.createContext<BareMetalDashboardContext>({});

type BareMetalDashboardContext = {
  obj?: BareMetalHostKind;
  machine?: MachineKind;
  node?: NodeKind;
  nodeMaintenance?: K8sResourceKind;
  loaded?: boolean;
};
