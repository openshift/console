import { render, screen } from '@testing-library/react';
import type { ClusterResourceQuotaKind } from '@console/internal/module/k8s';
import ClusterResourceQuotaCharts from '../ClusterResourceQuotaCharts';

jest.mock('@console/internal/components/graphs/donut', () => ({
  DonutChart: jest.fn(({ title, label }: { title: string; label: string }) => `${title} ${label}`),
}));

jest.mock('../utils', () => ({
  getLabelAndUsage: jest.fn(({ used, hard }: { used: string; hard: string }) => ({
    label: `${used || 0} of ${hard}`,
    percent: hard ? (parseInt(used || '0', 10) / parseInt(hard, 10)) * 100 : 0,
  })),
}));

describe('ClusterResourceQuotaCharts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockQuota = (
    hardResources: Record<string, string> = {},
    usedResources: Record<string, string> = {},
  ): ClusterResourceQuotaKind =>
    ({
      apiVersion: 'quota.openshift.io/v1',
      kind: 'ClusterResourceQuota',
      metadata: {
        name: 'test-crq',
      },
      status: {
        total: {
          hard: hardResources,
          used: usedResources,
        },
      },
    } as ClusterResourceQuotaKind);

  it('should display "No quota" when no hard quotas are set', () => {
    const quota = createMockQuota({}, {});
    render(<ClusterResourceQuotaCharts clusterResourceQuota={quota} />);

    expect(screen.getByText('No quota')).toBeVisible();
  });

  it('should display "No quota" when status is undefined', () => {
    const quota: ClusterResourceQuotaKind = {
      apiVersion: 'quota.openshift.io/v1',
      kind: 'ClusterResourceQuota',
      metadata: {
        name: 'test-crq',
      },
    } as ClusterResourceQuotaKind;

    render(<ClusterResourceQuotaCharts clusterResourceQuota={quota} />);

    expect(screen.getByText('No quota')).toBeVisible();
  });

  it('should render donut chart for each resource', () => {
    const quota = createMockQuota({ pods: '10', secrets: '20' }, { pods: '5', secrets: '10' });

    render(<ClusterResourceQuotaCharts clusterResourceQuota={quota} />);

    expect(screen.getByText(/pods/)).toBeVisible();
    expect(screen.getByText(/secrets/)).toBeVisible();
  });

  it('should display resource name and usage label on chart', () => {
    const quota = createMockQuota({ pods: '10' }, { pods: '5' });

    render(<ClusterResourceQuotaCharts clusterResourceQuota={quota} />);

    expect(screen.getByText(/pods/)).toBeVisible();
    expect(screen.getByText(/5 of 10/)).toBeVisible();
  });

  it('should render multiple charts for different resource types', () => {
    const quota = createMockQuota(
      {
        'limits.cpu': '4',
        'limits.memory': '8Gi',
        pods: '20',
      },
      {
        'limits.cpu': '2',
        'limits.memory': '4Gi',
        pods: '10',
      },
    );

    render(<ClusterResourceQuotaCharts clusterResourceQuota={quota} />);

    expect(screen.getByText(/limits\.cpu/)).toBeVisible();
    expect(screen.getByText(/limits\.memory/)).toBeVisible();
    expect(screen.getByText(/pods/)).toBeVisible();
    expect(screen.getByText(/2 of 4/)).toBeVisible();
    expect(screen.getByText(/10 of 20/)).toBeVisible();
  });
});
