import { ServiceBinding } from '../types';

export const connectedServiceBinding: ServiceBinding = {
  apiVersion: 'binding.operators.coreos.com/v1alpha1',
  kind: 'ServiceBinding',
  metadata: {
    namespace: 'a-namespace',
    name: 'connected-service-binding',
  },
  spec: {
    application: {
      group: 'apps',
      name: 'nodeinfo-from-source',
      resource: 'deployments',
      version: 'v1',
    },
    services: [
      {
        group: 'postgres-operator.crunchydata.com',
        kind: 'PostgresCluster',
        name: 'example',
        version: 'v1beta1',
      },
    ],
  },
  status: {
    conditions: [
      {
        type: 'CollectionReady',
        status: 'True',
        reason: 'DataCollected',
        message: '',
      },
      {
        type: 'InjectionReady',
        status: 'True',
        reason: 'ApplicationUpdated',
        message: '',
      },
      {
        type: 'Ready',
        status: 'True',
        reason: 'ApplicationsBound',
        message: '',
      },
    ],
  },
};

export const connectedServiceBindingWithAnUnknownConditionError: ServiceBinding = {
  apiVersion: 'binding.operators.coreos.com/v1alpha1',
  kind: 'ServiceBinding',
  metadata: {
    namespace: 'a-namespace',
    name: 'connected-service-binding-with-an-unknown-condition-error',
  },
  spec: {
    application: {
      group: 'apps',
      name: 'nodeinfo-from-source',
      resource: 'deployments',
      version: 'v1',
    },
    services: [
      {
        group: 'postgres-operator.crunchydata.com',
        kind: 'PostgresCluster',
        name: 'example',
        version: 'v1beta1',
      },
    ],
  },
  status: {
    conditions: [
      {
        type: 'CollectionReady',
        status: 'True',
        reason: 'DataCollected',
        message: '',
      },
      {
        type: 'InjectionReady',
        status: 'True',
        reason: 'ApplicationUpdated',
        message: '',
      },
      {
        type: 'Ready',
        status: 'True',
        reason: 'ApplicationsBound',
        message: '',
      },
      {
        type: 'UnknownType',
        status: 'False',
        reason: 'Error',
        message: 'An error message',
      },
    ],
  },
};

export const allConnectedServiceBindings = [
  connectedServiceBinding,
  connectedServiceBindingWithAnUnknownConditionError,
];

export const failedServiceBinding: ServiceBinding = {
  apiVersion: 'binding.operators.coreos.com/v1alpha1',
  kind: 'ServiceBinding',
  metadata: {
    namespace: 'a-namespace',
    name: 'failed-service-binding',
  },
  spec: {
    application: {
      group: 'apps',
      name: 'nodeinfo',
      resource: 'deployments',
      version: 'v1',
    },
    services: [
      {
        group: 'redis.redis.opstreelabs.in',
        kind: 'Redis',
        name: 'redis-standalone',
        version: 'v1beta1',
      },
    ],
  },
  status: {
    conditions: [
      {
        type: 'CollectionReady',
        status: 'False',
        reason: 'ErrorReadingBinding',
        message: 'redisSecret is not found',
      },
      {
        type: 'Ready',
        status: 'False',
        reason: 'ProcessingError',
        message: 'redisSecret is not found',
      },
    ],
  },
};

export const failedServiceBindingMissingCondition: ServiceBinding = {
  apiVersion: 'binding.operators.coreos.com/v1alpha1',
  kind: 'ServiceBinding',
  metadata: {
    namespace: 'a-namespace',
    name: 'failed-service-binding-missing-condition',
  },
  spec: {
    application: {
      group: 'apps',
      name: 'nodeinfo-from-source',
      resource: 'deployments',
      version: 'v1',
    },
    services: [
      {
        group: 'postgres-operator.crunchydata.com',
        kind: 'PostgresCluster',
        name: 'example',
        version: 'v1beta1',
      },
    ],
  },
  status: {
    conditions: [
      {
        type: 'InjectionReady',
        status: 'True',
        reason: 'ApplicationUpdated',
        message: '',
      },
      {
        type: 'Ready',
        status: 'True',
        reason: 'ApplicationsBound',
        message: '',
      },
    ],
  },
};

export const failedServiceBindingWithAllConditions: ServiceBinding = {
  apiVersion: 'binding.operators.coreos.com/v1alpha1',
  kind: 'ServiceBinding',
  metadata: {
    namespace: 'a-namespace',
    name: 'failed-service-binding-with-all-conditions',
  },
  spec: {
    application: {
      group: 'apps',
      name: 'nodeinfo',
      resource: 'deployments',
      version: 'v1',
    },
    services: [
      {
        group: 'redis.redis.opstreelabs.in',
        kind: 'Redis',
        name: 'redis-standalone',
        version: 'v1beta1',
      },
    ],
  },
  status: {
    conditions: [
      {
        type: 'CollectionReady',
        status: 'False',
        reason: 'ErrorReadingBinding',
        message: 'redisSecret is not found',
      },
      {
        type: 'InjectionReady',
        status: 'True',
        reason: 'ApplicationUpdated',
        message: '',
      },
      {
        type: 'Ready',
        status: 'False',
        reason: 'ProcessingError',
        message: 'redisSecret is not found',
      },
    ],
  },
};

export const allFailedServiceBindings = [
  failedServiceBinding,
  failedServiceBindingMissingCondition,
  failedServiceBindingWithAllConditions,
];
