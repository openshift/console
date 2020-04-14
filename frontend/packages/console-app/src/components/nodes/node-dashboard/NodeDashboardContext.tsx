import * as React from 'react';
import { NodeKind } from '@console/internal/module/k8s';

export const NodeDashboardContext = React.createContext<NodeDashboardContext>({});

type NodeDashboardContext = {
  obj?: NodeKind;
};
