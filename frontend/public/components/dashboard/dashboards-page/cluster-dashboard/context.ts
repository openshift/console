import { createContext } from 'react';
import type { K8sResourceKind } from '../../../../module/k8s';

export const ClusterDashboardContext = createContext<ClusterDashboardContext>({
  infrastructureLoaded: true,
  infrastructureError: null,
});

type ClusterDashboardContext = {
  infrastructure?: K8sResourceKind;
  infrastructureLoaded: boolean;
  infrastructureError: any;
};
