import {
  getBindableResources,
  getOperatorBackedServiceResources,
} from '../bindable-services-utils';
import {
  watchedResources,
  expectedBindableResources,
  csvResources,
} from './bindable-services-utils-data';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  k8sGet: () => ({
    apiVersion: 'binding.operators.coreos.com/v1alpha1',
    kind: 'BindableKinds',
    metadata: {
      name: 'bindable-kinds',
      resourceVersion: '34433',
      uid: 'c73ede05-0240-4a9e-9a98-c76c23ab24d3',
    },
    status: [
      { group: 'redis.redis.opstreelabs.in', kind: 'Redis', version: 'v1beta1' },
      { group: 'rabbitmq.com', kind: 'RabbitmqCluster', version: 'v1beta1' },
      {
        group: 'postgres-operator.crunchydata.com',
        kind: 'PostgresCluster',
        version: 'v1beta1',
      },
      {
        group: 'postgresql.k8s.enterprisedb.io',
        kind: 'Cluster',
        version: 'v1',
      },
      {
        group: 'rhoas.redhat.com',
        kind: 'ServiceRegistryConnection',
        version: 'v1alpha1',
      },
      {
        group: 'rhoas.redhat.com',
        kind: 'KafkaConnection',
        version: 'v1alpha1',
      },
    ],
  }),
}));

describe('bindable services utils', () => {
  it('should return all operator backed service resource types', () => {
    const operatorBackedServiceResources = getOperatorBackedServiceResources('test', csvResources);
    expect(operatorBackedServiceResources).toEqual(watchedResources);
  });
  it('should return all the bindable resource types', () => {
    const bindableResources = getBindableResources('test', csvResources);
    expect(bindableResources).toEqual(expectedBindableResources);
  });
});
