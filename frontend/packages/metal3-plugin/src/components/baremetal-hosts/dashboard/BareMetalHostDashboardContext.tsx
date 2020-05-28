import * as React from 'react';
import { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { BareMetalHostKind } from '../../../types';

export const BareMetalHostDashboardContext = React.createContext<BareMetalDashboardContext>({});

type BareMetalDashboardContext = {
  obj?: BareMetalHostKind;
  machine?: MachineKind;
  node?: NodeKind;
  loaded?: boolean;
};
