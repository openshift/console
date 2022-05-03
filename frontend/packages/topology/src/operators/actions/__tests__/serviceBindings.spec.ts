import { K8sResourceKind } from '@console/internal/module/k8s';
import { createServiceBindingResource } from '../serviceBindings';

describe('createServiceBindingResource', () => {
  it('creates the right ServiceBinding for a Deployment', () => {
    const source: K8sResourceKind = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        namespace: 'source-namespace',
        name: 'source-deployment',
      },
    };
    const target: K8sResourceKind = {
      apiVersion: 'rhoas.redhat.com/v1alpha1',
      kind: 'KafkaConnection',
      metadata: {
        namespace: 'target-namespace',
        name: 'target-kafkaconnection',
      },
    };
    const serviceBindingName = 'deployment-to-kafka';
    const actualServiceBinding = createServiceBindingResource(source, target, serviceBindingName);
    const expectedServiceBinding = {
      apiVersion: 'binding.operators.coreos.com/v1alpha1',
      kind: 'ServiceBinding',
      metadata: { name: 'deployment-to-kafka', namespace: 'source-namespace' },
      spec: {
        application: {
          group: 'apps',
          name: 'source-deployment',
          resource: 'deployments',
          version: 'v1',
        },
        detectBindingResources: true,
        services: [
          {
            group: 'rhoas.redhat.com',
            kind: 'KafkaConnection',
            name: 'target-kafkaconnection',
            version: 'v1alpha1',
          },
        ],
      },
    };
    expect(actualServiceBinding).toEqual(expectedServiceBinding);
  });

  it('creates the right ServiceBinding for a Pod', () => {
    const source: K8sResourceKind = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        namespace: 'source-namespace',
        name: 'source-pod',
      },
    };
    const target: K8sResourceKind = {
      apiVersion: 'rhoas.redhat.com/v1alpha1',
      kind: 'KafkaConnection',
      metadata: {
        namespace: 'target-namespace',
        name: 'target-kafkaconnection',
      },
    };
    const serviceBindingName = 'deployment-to-kafka';
    const actualServiceBinding = createServiceBindingResource(source, target, serviceBindingName);
    const expectedServiceBinding = {
      apiVersion: 'binding.operators.coreos.com/v1alpha1',
      kind: 'ServiceBinding',
      metadata: { name: 'deployment-to-kafka', namespace: 'source-namespace' },
      spec: {
        application: {
          group: 'core',
          name: 'source-pod',
          resource: 'pods',
          version: 'v1',
        },
        detectBindingResources: true,
        services: [
          {
            group: 'rhoas.redhat.com',
            kind: 'KafkaConnection',
            name: 'target-kafkaconnection',
            version: 'v1alpha1',
          },
        ],
      },
    };
    expect(actualServiceBinding).toEqual(expectedServiceBinding);
  });
});
