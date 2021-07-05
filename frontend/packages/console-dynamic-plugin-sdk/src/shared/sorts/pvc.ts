import * as UIActions from '@console/internal/actions/ui';
import { K8sResourceCommon } from '@console/internal/module/k8s';

export const pvcUsed = (pvc: K8sResourceCommon): number =>
  UIActions.getPVCMetric(pvc, 'usedCapacity');
