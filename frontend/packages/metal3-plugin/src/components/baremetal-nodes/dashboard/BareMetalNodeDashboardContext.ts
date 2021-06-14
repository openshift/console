import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { BareMetalHostKind, CertificateSigningRequestKind } from '../../../types';

export const BareMetalNodeDashboardContext = React.createContext<BareMetalNodeDashboardContext>({});

type BareMetalNodeDashboardContext = {
  host?: BareMetalHostKind;
  nodeMaintenance?: K8sResourceKind;
  csr?: CertificateSigningRequestKind;
};
