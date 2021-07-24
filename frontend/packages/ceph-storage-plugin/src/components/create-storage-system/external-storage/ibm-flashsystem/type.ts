import { K8sResourceCommon } from '@console/internal/module/k8s';

export type IBMFlashsystemStatus = {
  capacity?: {
    maxCapacity: string;
    usedCapacity: string;
  };
  id?: string;
  state?: string;
  phase?: string;
  version?: string;
};

export type IBMFlashsystemSpec = {
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

export type IBMFlashsystemKind = {
  spec: IBMFlashsystemSpec;
  status?: IBMFlashsystemStatus;
} & K8sResourceCommon;

export type FlashsystemState = {
  username: string;
  password: string;
  endpoint: string;
  poolname: string;
};
