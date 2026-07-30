import { screen } from '@testing-library/react';
import type { ClusterOperator } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ClusterOperatorStatusRow from '../OperatorStatus';

jest.mock('@console/internal/components/utils/resource-link', () => ({
  ResourceLink: jest.fn(({ name }: { name: string }) => name),
}));

jest.mock('@console/internal/models', () => ({
  ...jest.requireActual('@console/internal/models'),
  ClusterOperatorModel: {
    kind: 'ClusterOperator',
    apiVersion: 'config.openshift.io/v1',
    apiGroup: 'config.openshift.io',
    plural: 'clusteroperators',
  },
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceForModel: jest.fn(() => 'config.openshift.io~v1~ClusterOperator'),
}));

describe('ClusterOperatorStatusRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockOperatorStatus = (name: string, statusTitle: string) => ({
    status: {
      title: statusTitle,
      icon: null,
      priority: 0,
      health: 'OK' as const,
    },
    operators: [
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'ClusterOperator',
        metadata: {
          name,
        },
      } as ClusterOperator,
    ],
  });

  it('should render operator status value', () => {
    const operatorStatus = createMockOperatorStatus('authentication', 'Available');

    renderWithProviders(<ClusterOperatorStatusRow operatorStatus={operatorStatus} />);

    expect(screen.getByText('Available')).toBeVisible();
  });

  it('should render operator name as resource link', () => {
    const operatorStatus = createMockOperatorStatus('console', 'Degraded');

    renderWithProviders(<ClusterOperatorStatusRow operatorStatus={operatorStatus} />);

    expect(screen.getByText('console')).toBeVisible();
  });

  it('should render status popup wrapper', () => {
    const operatorStatus = createMockOperatorStatus('dns', 'Available');

    renderWithProviders(<ClusterOperatorStatusRow operatorStatus={operatorStatus} />);

    expect(screen.getByText('dns')).toBeVisible();
    expect(screen.getByText('Available')).toBeVisible();
  });
});
