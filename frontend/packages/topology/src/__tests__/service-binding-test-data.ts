import { apiVersionForModel, DeploymentKind } from '@console/internal/module/k8s';
import { ServiceBindingModel } from '../models';
import { TopologyDataResources } from '../topology-types';

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
        apiVersion: apiVersionForModel(ServiceBindingModel),
        kind: ServiceBindingModel.kind,
        metadata: {
          name: 'sbr-1',
        },
        spec: {
          application: {
            name: 'app',
            group: 'apps',
            version: 'v1',
            resource: 'deployments',
          },
          services: [
            {
              group: 'postgresql.baiju.dev',
              version: 'v1alpha1',
              kind: 'Jaeger',
              name: 'jaeger-all-in-one-inmemory',
            },
            {
              group: 'postgresql.baiju.dev',
              version: 'v1alpha1',
              kind: 'Jaeger',
              name: 'jaeger-all-in-one-inmemory',
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
        apiVersion: apiVersionForModel(ServiceBindingModel),
        kind: ServiceBindingModel.kind,
        metadata: {
          name: 'sbr-2',
        },
        spec: {
          application: {
            name: 'app',
            group: 'apps',
            version: 'v1',
            resource: 'deployments',
          },
          services: [
            {
              group: 'postgresql.baiju.dev',
              version: 'v1alpha1',
              kind: 'Jaeger',
              name: 'jaeger-all-in-one-inmemory',
            },
          ],
          detectBindingResources: true,
        },
      },
    ],
  },
};
