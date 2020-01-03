import { K8sResourceKind } from '@console/internal/module/k8s';

export const serviceBindingRequest: K8sResourceKind = {
  data: {
    apiVersion: 'apps.openshift.io/v1alpha1',
    kind: 'ServiceBindingRequest',
    metadata: {
      name: 'analytics-deployment-D-wit-deployment-D',
      namespace: 'testproject1',
    },
    spec: {
      applicationSelector: {
        group: 'apps',
        resource: 'deployments',
        resourceRef: 'analytics-deployment',
        version: 'v1',
      },
      backingServiceSelector: {
        group: '',
        kind: undefined,
        resourceRef: undefined,
        version: undefined,
      },
      detectBindingResources: true,
    },
  },
};
