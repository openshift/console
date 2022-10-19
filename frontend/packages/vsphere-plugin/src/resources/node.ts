import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';

export type Node = K8sResourceCommon & {
  status?: {
    addresses?: { type: string; address: string }[];
  };
};
