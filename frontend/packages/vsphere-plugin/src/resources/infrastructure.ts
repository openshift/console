import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';

export type Infrastructure = K8sResourceCommon & {
  spec?: {
    cloudConfig: {
      key: string; // config
      name: string; // cloud-provider-config
    };
    platformSpec: {
      type: string; // VSphere;
    };
  };
  status?: {
    platform?: string; // VSphere
  };
};
