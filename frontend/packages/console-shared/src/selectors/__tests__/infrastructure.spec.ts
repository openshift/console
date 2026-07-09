import type { K8sResourceKind } from '@console/internal/module/k8s';
import { getInfrastructureName } from '../infrastructure';

describe('getInfrastructureName', () => {
  const tests: {
    description: string;
    infrastructure: K8sResourceKind;
    expected: string | undefined;
  }[] = [
    {
      description: 'returns infrastructureName from status',
      infrastructure: {
        apiVersion: 'config.openshift.io/v1',
        kind: 'Infrastructure',
        metadata: { name: 'cluster' },
        status: { infrastructureName: 'example-cluster-abc12' },
      },
      expected: 'example-cluster-abc12',
    },
    {
      description: 'returns undefined when infrastructure is undefined',
      infrastructure: undefined,
      expected: undefined,
    },
    {
      description: 'returns undefined when status is missing',
      infrastructure: {
        apiVersion: 'config.openshift.io/v1',
        kind: 'Infrastructure',
        metadata: { name: 'cluster' },
      },
      expected: undefined,
    },
    {
      description: 'returns undefined when infrastructureName is missing from status',
      infrastructure: {
        apiVersion: 'config.openshift.io/v1',
        kind: 'Infrastructure',
        metadata: { name: 'cluster' },
        status: { platform: 'BareMetal' },
      },
      expected: undefined,
    },
  ];

  it.each(tests)('$description', ({ infrastructure, expected }) => {
    expect(getInfrastructureName(infrastructure)).toBe(expected);
  });
});
