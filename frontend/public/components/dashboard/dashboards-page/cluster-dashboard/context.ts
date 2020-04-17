import * as React from 'react';
import { K8sResourceKind } from '../../../../module/k8s';

export const ClusterDashboardContext = React.createContext<ClusterDashboardContext>({
  infrastructureLoaded: true,
  infrastructureError: null,
});

type ClusterDashboardContext = {
  infrastructure?: K8sResourceKind;
  infrastructureLoaded: boolean;
  infrastructureError: any;
};
