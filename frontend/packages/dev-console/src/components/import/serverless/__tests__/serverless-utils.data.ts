import { K8sResourceKind } from '@console/internal/module/k8s';

export const domainMappings: K8sResourceKind[] = [
  {
    apiVersion: 'serving.knative.dev/v1alpha1',
    kind: 'DomainMapping',
    metadata: {
      annotations: {
        'serving.knative.dev/creator': 'kube:admin',
        'serving.knative.dev/lastModifier': 'kube:admin',
      },
      name: 'example.domain1.org',
      uid: 'b1bd0ae9-c6a7-4bbc-badc-06490f329608',
    },
    spec: {
      ref: {
        apiVersion: 'serving.knative.dev/v1',
        kind: 'Service',
        name: 'service-one',
        namespace: 'karthik',
      },
    },
  },
  {
    apiVersion: 'serving.knative.dev/v1alpha1',
    kind: 'DomainMapping',
    metadata: {
      annotations: {
        'serving.knative.dev/creator': 'kube:admin',
        'serving.knative.dev/lastModifier': 'kube:admin',
      },
      name: 'example.domain2.org',
      uid: 'b1bd0ae9-c6a7-4bbc-badc-06490f329709',
    },
    spec: {
      ref: {
        apiVersion: 'serving.knative.dev/v1',
        kind: 'Service',
        name: 'service-two',
        namespace: 'karthik',
      },
    },
  },
];
