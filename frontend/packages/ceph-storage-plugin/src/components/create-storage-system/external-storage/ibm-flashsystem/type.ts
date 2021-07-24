import { K8sResourceCommon } from '@console/internal/module/k8s';

export type IBMFlashSystemStatus = {
  capacity?: {
    maxCapacity: string;
    usedCapacity: string;
  };
  id?: string;
  state?: string;
  phase?: string;
  version?: string;
};

export type IBMFlashSystemSpec = {
  name?: string;
  defaultPool?: {
    fsType: string;
    poolName: string;
    spaceEfficiency: string;
    storageclassName: string;
    volumeNamePrefix: string;
  };
  insecureSkipVerify: boolean;
  secret?: {
    name?: string;
    namespace?: string;
  };
};

export type IBMFlashSystemKind = {
  spec: IBMFlashSystemSpec;
  status?: IBMFlashSystemStatus;
} & K8sResourceCommon;

export type FlashSystemState = {
  username: string;
  password: string;
  endpoint: string;
  poolname: string;
};
