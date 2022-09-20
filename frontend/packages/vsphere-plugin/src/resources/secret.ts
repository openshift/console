import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';

export type Secret = K8sResourceCommon & {
  data?: { [key: string]: string };
};
