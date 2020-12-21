import { K8sResourceCommon } from '../../k8s';

export type ApprovalKind = K8sResourceCommon & {
  namespace?: string;
  apiGroup?: string;
};

export type ServiceBrokerKind = K8sResourceCommon & {
  spec: {
    url?: string;
  };
};

export type ServiceClassKind = K8sResourceCommon & {
  spec: {
    bindable?: boolean;
    externalName?: string;
    serviceBrokerName?: string;
  };
};

export type ServicePlanKind = K8sResourceCommon & {
  spec: {
    bindable?: boolean;
    externalName?: string;
    serviceBrokerName?: string;
    serviceClassRef: {
      name?: string;
    };
  };
};
// export type K8sResourceCommon = {
//     apiVersion?: string;
//     kind?: string;
//     metadata?: ObjectMetadata;
//   };
