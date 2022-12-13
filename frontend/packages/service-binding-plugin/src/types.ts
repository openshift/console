import { K8sResourceCommon, K8sResourceCondition } from '@console/internal/module/k8s';

export type ServiceBinding = K8sResourceCommon & {
  spec: {
    application: {
      group: string;
      version: string;
      resource: string;
      name?: string;
      labelSelector?: {
        matchLabels: {
          [key: string]: string;
        };
      };
    };
    services: {
      group: string;
      version: string;
      kind: string;
      name: string;
    }[];
    bindAsFiles?: boolean;
    detectBindingResources?: boolean;
  };
  status?: {
    conditions?: K8sResourceCondition[];
  };
};

// The enum values need to match the dynamic-plugin `Status` `status` prop.
// A translation (title) is added in the ServiceBindingStatus component.
export enum ComputedServiceBindingStatus {
  CONNECTED = 'Connected',
  ERROR = 'Error',
}
