import * as React from 'react';
import { PodKind, K8sResourceKind } from '@console/internal/module/k8s';
import { VMKind, VMIKind } from '../../types';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';

export const VMDashboardContext = React.createContext<VMDashboardContext>({});

type VMDashboardContext = {
  vm?: VMKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  vmi?: VMIKind;
  vmImports?: VMImportKind[];
};
