import * as React from 'react';
import { PodKind } from '../module/k8s';

export const PodDashboardContext = React.createContext<PodDashboardContext>({});

type PodDashboardContext = {
  pod?: PodKind;
};
