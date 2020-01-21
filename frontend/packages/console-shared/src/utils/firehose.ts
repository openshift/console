import { FirehoseResult } from '@console/internal/components/utils';
import { K8sResourceCommon, K8sResourceKind } from '@console/internal/module/k8s';

export const getLoadedData = <
  A extends K8sResourceCommon | K8sResourceCommon[] = K8sResourceKind[]
>(
  result: FirehoseResult<A>,
  defaultValue: A = null,
): A => (result && result.loaded && !result.loadError ? result.data : defaultValue);
