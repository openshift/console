import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';

export type ConfigMap = K8sResourceCommon & {
  data?: { config?: string /* free form */ };
};
