import { K8sResourceCommon } from '@console/internal/module/k8s';
import { CustomRunStatus } from './computedStatus';
import { TektonTaskSpec } from './coreTekton';

export type TaskKind = K8sResourceCommon & {
  spec: TektonTaskSpec;
};

export type CustomRunKind = K8sResourceCommon & {
  spec: {
    customRef: {
      apiVersion: string;
      kind: string;
    };
    serviceAccountName?: string;
    status?: CustomRunStatus;
    statusMessage?: string;
  };
};

export type ApprovalTaskKind = K8sResourceCommon & {
  spec?: {
    approvals: {
      input: string;
      message: string;
      name: string;
    }[];
    approvalsRequired: number;
  };
  status?: {
    approvalState: string;
    approvals: string[];
    approvedBy: {
      name: string;
      approved: string;
    }[];
  };
};
