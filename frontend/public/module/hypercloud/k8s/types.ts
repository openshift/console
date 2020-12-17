import { K8sResourceCommon } from '../../k8s';

export type ApprovalKind = K8sResourceCommon & {
  namespace?: string;
  apiGroup?: string;
};

export type NamespaceClaimKind = K8sResourceCommon & {
  namespace?: string;
  apiGroup?: string;
};

export type ResourceQuotaClaimKind = K8sResourceCommon & {
  namespace?: string;
  apiGroup?: string;
};

// export type K8sResourceCommon = {
//     apiVersion?: string;
//     kind?: string;
//     metadata?: ObjectMetadata;
//   };
