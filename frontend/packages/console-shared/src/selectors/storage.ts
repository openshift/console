import { K8sResourceKind } from '@console/internal/module/k8s';

export const getRequestedPVCSize = (pvc: K8sResourceKind): string =>
  pvc?.spec?.resources?.requests?.storage;
