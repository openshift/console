import { DeploymentKind, K8sResourceKind } from '@console/internal/module/k8s';
import { TopologyDataResources } from '../topology-types';

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

export const sbrBackingServiceSelectors: Partial<TopologyDataResources> = {
  deployments: {
    loaded: true,
    loadError: null,
    data: [
      {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: 'app',
          uid: 'uid-app',
        },
      } as DeploymentKind,
      {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: 'db-1',
          uid: 'uid-db-1',
          ownerReferences: [
            {
              apiVersion: 'db/v1alpha1',
              kind: 'Database',
              name: 'db-demo1',
              uid: 'uid-db-demo1',
            },
          ],
        },
      } as DeploymentKind,
      {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: 'db-2',
          uid: 'uid-db-2',
          ownerReferences: [
            {
              apiVersion: 'postgresql.baiju.dev/v1alpha1',
              kind: 'Database',
              name: 'db-demo2',
              uid: 'uid-db-demo2',
            },
          ],
        },
      } as DeploymentKind,
    ],
  },
  serviceBindingRequests: {
    loaded: true,
    loadError: null,
    data: [
      {
        apiVersion: 'apps.openshift.io/v1alpha1',
        kind: 'ServiceBindingRequest',
        metadata: {
          name: 'sbr-1',
        },
        spec: {
          applicationSelector: {
            resourceRef: 'app',
            group: 'apps',
            version: 'v1',
            resource: 'deployments',
          },
          backingServiceSelectors: [
            {
              group: 'postgresql.baiju.dev',
              version: 'v1alpha1',
              kind: 'Jaeger',
              resourceRef: 'jaeger-all-in-one-inmemory',
            },
            {
              group: 'postgresql.baiju.dev',
              version: 'v1alpha1',
              kind: 'Jaeger',
              resourceRef: 'jaeger-all-in-one-inmemory',
            },
          ],
          detectBindingResources: true,
        },
      },
    ],
  },
};

export const sbrBackingServiceSelector: Partial<TopologyDataResources> = {
  deployments: {
    loaded: true,
    loadError: null,
    data: [
      {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: 'app',
          uid: 'uid-app',
        },
      } as DeploymentKind,
      {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: 'db-1',
          uid: 'uid-db-1',
          ownerReferences: [
            {
              apiVersion: 'db/v1alpha1',
              kind: 'Database',
              name: 'db-demo1',
              uid: 'uid-db-demo1',
            },
          ],
        },
      } as DeploymentKind,
    ],
  },
  serviceBindingRequests: {
    loaded: true,
    loadError: null,
    data: [
      {
        apiVersion: 'apps.openshift.io/v1alpha1',
        kind: 'ServiceBindingRequest',
        metadata: {
          name: 'sbr-2',
        },
        spec: {
          applicationSelector: {
            resourceRef: 'app',
            group: 'apps',
            version: 'v1',
            resource: 'deployments',
          },
          backingServiceSelector: {
            group: 'postgresql.baiju.dev',
            version: 'v1alpha1',
            kind: 'Jaeger',
            resourceRef: 'jaeger-all-in-one-inmemory',
          },
          detectBindingResources: true,
        },
      },
    ],
  },
};
