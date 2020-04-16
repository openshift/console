import * as React from 'react';
import { BareMetalHostKind } from '../../../types';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const BareMetalNodeDashboardContext = React.createContext<BareMetalNodeDashboardContext>({});

type BareMetalNodeDashboardContext = {
  host?: BareMetalHostKind;
  nodeMaintenance?: K8sResourceKind;
};
