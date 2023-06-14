import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';

export type Infrastructure = K8sResourceCommon & {
  spec?: {
    cloudConfig: {
      key: string; // config
      name: string; // cloud-provider-config
    };
    platformSpec: {
      type: string; // VSphere;
      vsphere?: {
        failureDomains?: {
          name?: string;
          region?: string;
          server?: string;
          topology?: {
            computeCluster?: string;
            datacenter?: string;
            datastore?: string;
            networks?: string[];
            resourcePool?: string;
          };
          zone?: string;
        }[];
        nodeNetworking?: {
          external?: {};
          internal?: {};
        };
        vcenters?: {
          datacenters?: string[];
          port?: number;
          server?: string;
        }[];
      };
    };
  };
  status?: {
    platform?: string; // VSphere
  };
};
