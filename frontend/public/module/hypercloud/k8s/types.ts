import { K8sResourceCommon, K8sResourceKind } from '../../k8s';

export type ApprovalKind = K8sResourceCommon & {
  namespace?: string;
  apiGroup?: string;
};

export type CatalogServiceClaimKind = K8sResourceKind & {
  resourceName?: string;
};

// export type TemplateKind = K8sResourceCommon & {

// }

// export type TemplateInstanceKind = K8sResourceCommon & {

// }

export type K8sClaimResourceKind = K8sResourceKind & {
  resourceName?: string;
};

// export type K8sResourceCommon = {
//     apiVersion?: string;
//     kind?: string;
//     metadata?: ObjectMetadata;
//   };
