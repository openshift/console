import { K8sResourceCommon, K8sResourceKind } from '../../k8s';

export type ApprovalKind = K8sResourceCommon & {
  namespace?: string;
  apiGroup?: string;
};

export type K8sClaimResourceKind = K8sResourceKind & {
  resourceName?: string;
};

// export type K8sResourceCommon = {
//     apiVersion?: string;
//     kind?: string;
//     metadata?: ObjectMetadata;
//   };
