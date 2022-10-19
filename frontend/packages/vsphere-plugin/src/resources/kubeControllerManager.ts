import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';

export type KubeControllerManager = K8sResourceCommon & {
  spec?: {
    forceRedeploymentReason?: string;
  };
};
