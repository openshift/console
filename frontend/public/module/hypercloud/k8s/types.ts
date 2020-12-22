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

export type ClusterServiceBrokerKind = K8sResourceCommon & {
  spec: {
    url?: string;
  };
};

export type ClusterServiceClassKind = K8sResourceCommon & {
  spec: {
    bindable?: boolean;
    externalName?: string;
    clusterServiceBrokerName?: string;
  };
};

export type ClusterServicePlanKind = K8sResourceCommon & {
  spec: {
    bindable?: boolean;
    externalName?: string;
    clusterServiceBrokerName?: string;
    clusterServiceClassRef: {
      name?: string;
    };
  };
};

export type ServiceInstanceKind = K8sResourceCommon & {
  spec: {
    serviceClassName?: string;
    servicePlanName?: string;
  };
};

export type ServiceBindingKind = K8sResourceCommon & {
  spec: {
    instanceRef?: {
      name?: string;
    };
    secretName?: string;
  };
};

export type CatalogServiceClaimKind = K8sResourceCommon & {
  resourceName?: string;
  status?: {
    status?: string;
    reason?: string;
  };
};

// export type TemplateKind = K8sResourceCommon & {

// }

// export type TemplateInstanceKind = K8sResourceCommon & {
  
// }

// export type K8sResourceCommon = {
//     apiVersion?: string;
//     kind?: string;
//     metadata?: ObjectMetadata;
//   };
