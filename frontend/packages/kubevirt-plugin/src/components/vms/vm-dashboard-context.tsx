import * as React from 'react';
import { PodKind, K8sResourceKind } from '@console/internal/module/k8s';
import { VMKind, VMIKind } from '../../types';

export const VMDashboardContext = React.createContext<VMDashboardContext>({});

type VMDashboardContext = {
  vm?: VMKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  vmi?: VMIKind;
};
