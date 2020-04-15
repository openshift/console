import * as React from 'react';
import { PodKind } from '@console/internal/module/k8s';
import { VMKind, VMIKind } from '../../types';
import { VMStatusBundle } from '../../statuses/vm/types';

export const VMDashboardContext = React.createContext<VMDashboardContext>({});

type VMDashboardContext = {
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];

  vmStatusBundle?: VMStatusBundle;
};
