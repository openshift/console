import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { BareMetalHostKind, CertificateSigningRequestKind } from '../../../types';

export const BareMetalNodeDashboardContext = React.createContext<BareMetalNodeDashboardContext>({
  hostsLoaded: false,
});

type BareMetalNodeDashboardContext = {
  host?: BareMetalHostKind;
  hostsLoaded: boolean;
  nodeMaintenance?: K8sResourceKind;
  csr?: CertificateSigningRequestKind;
};
