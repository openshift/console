import * as fetchUtils from '@console/dev-console/src/components/topology/bindable-services/fetch-bindable-services-utils';
import {
  getBindableResources,
  getOperatorBackedServiceResources,
} from '../bindable-services-utils';
import {
  watchedResources,
  expectedBindableResources,
  csvResources,
} from './bindable-services-utils-data';

const mockBindableData = [
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
];

describe('bindable services utils', () => {
  it('should return all operator backed service resource types', () => {
    const operatorBackedServiceResources = getOperatorBackedServiceResources('test', csvResources);
    expect(operatorBackedServiceResources).toEqual(watchedResources);
  });
  it('should return all the bindable resource types', () => {
    const getBindableServicesListSpy = jest
      .spyOn(fetchUtils, 'getBindableServicesList')
      .mockImplementation(() => mockBindableData);
    const bindableResources = getBindableResources('test', csvResources);
    expect(getBindableServicesListSpy).toHaveBeenCalledTimes(1);
    expect(bindableResources).toEqual(expectedBindableResources);
  });
});
