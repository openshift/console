import { screen } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { UsageIcon, ResourceUsageRow, getACRQResourceUsage } from '../resource-quota';

describe('Check getResourceUsage for AppliedClusterResourceQuota', () => {
  const quota = {
    apiVersion: 'quota.openshift.io/v1',
    kind: 'AppliedClusterResourceQuota',
    metadata: { name: 'example' },
    spec: { quota: { hard: { 'limits.cpu': '2' } } },
    status: {
      namespaces: [
        {
          namespace: 'test-namespace',
          status: { used: { 'limits.cpu': '0' }, hard: { 'limits.cpu': '2' } },
        },
        {
          namespace: 'test-namespace2',
          status: { used: { 'limits.cpu': '1' }, hard: { 'limits.cpu': '2' } },
        },
      ],
      total: { hard: { 'limits.cpu': '2' }, used: { 'limits.cpu': '1' } },
    },
  };

  it('Provides correct cluster-only data', () => {
    expect(getACRQResourceUsage(quota, 'limits.cpu')).toEqual({
      used: { cluster: '1', namespace: 0 },
      totalUsed: '1',
      max: '2',
      percent: { namespace: 0, otherNamespaces: 50, unused: 50 },
    });
  });
  it('Provides correct namespaced data', () => {
    expect(getACRQResourceUsage(quota, 'limits.cpu', 'test-namespace')).toEqual({
      used: { cluster: '1', namespace: '0' },
      totalUsed: '1',
      max: '2',
      percent: { namespace: 0, otherNamespaces: 50, unused: 50 },
    });
    expect(getACRQResourceUsage(quota, 'limits.cpu', 'test-namespace2')).toEqual({
      used: { cluster: '1', namespace: '1' },
      totalUsed: '1',
      max: '2',
      percent: { namespace: 50, otherNamespaces: 0, unused: 50 },
    });
  });
});

describe('UsageIcon', () => {
  it('renders an icon for 0% usage', () => {
    renderWithProviders(<UsageIcon percent={0} />);

    expect(screen.getByRole('img', { hidden: true })).toBeVisible();
  });

  it('renders an icon for low usage (25%)', () => {
    renderWithProviders(<UsageIcon percent={25} />);

    expect(screen.getByRole('img', { hidden: true })).toBeVisible();
  });

  it('renders an icon for high usage (75%)', () => {
    renderWithProviders(<UsageIcon percent={75} />);

    expect(screen.getByRole('img', { hidden: true })).toBeVisible();
  });

  it('renders an icon for complete usage (100%)', () => {
    renderWithProviders(<UsageIcon percent={100} />);

    expect(screen.getByRole('img', { hidden: true })).toBeVisible();
  });

  it('renders a warning icon for over-usage (101%)', () => {
    renderWithProviders(<UsageIcon percent={101} />);

    expect(screen.getByRole('img', { hidden: true })).toBeVisible();
  });
});

describe('Check quota table columns by ResourceUsageRow', () => {
  const quota = {
    apiVersion: 'v1',
    kind: 'ResourceQuota',
    metadata: { name: 'example', namespace: 'example' },
    spec: { hard: { 'limits.cpu': 2 } },
    status: { hard: { 'limits.cpu': 2 }, used: { 'limits.cpu': 1 } },
  };

  it('verifies resource quota information in table columns', () => {
    renderWithProviders(
      <table>
        <tbody>
          <ResourceUsageRow resourceType={'limits.cpu'} quota={quota} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('limits.cpu')).toBeVisible();

    // Verify usage icon is visible to users
    expect(screen.getByRole('img', { hidden: true })).toBeVisible();

    // Verify the current usage
    expect(screen.getByText('1')).toBeVisible();

    // Verify the limit
    expect(screen.getByText('2')).toBeVisible();
  });
});

describe('Check cluster quota table columns by ResourceUsageRow', () => {
  const quota = {
    apiVersion: 'quota.openshift.io/v1',
    kind: 'ClusterResourceQuota',
    metadata: { name: 'example' },
    spec: { quota: { hard: { 'limits.cpu': 2 } } },
    status: { total: { hard: { 'limits.cpu': 2 }, used: { 'limits.cpu': 1 } } },
  };

  it('verifies cluster resource quota information in table columns', () => {
    renderWithProviders(
      <table>
        <tbody>
          <ResourceUsageRow resourceType={'limits.cpu'} quota={quota} />
        </tbody>
      </table>,
    );

    // Verify the resource type
    expect(screen.getByText('limits.cpu')).toBeVisible();

    // Verify usage icon is visible to users
    expect(screen.getByRole('img', { hidden: true })).toBeVisible();

    // Verify current usage
    expect(screen.getByText('1')).toBeVisible();

    // Verify the limit
    expect(screen.getByText('2')).toBeVisible();
  });
});

describe('Check applied cluster quota table columns by ResourceUsageRow', () => {
  const quota = {
    apiVersion: 'quota.openshift.io/v1',
    kind: 'AppliedClusterResourceQuota',
    metadata: { name: 'example' },
    spec: { quota: { hard: { 'limits.cpu': 2 } } },
    status: {
      namespaces: [
        {
          namespace: 'test-namespace',
          status: { used: { 'limits.cpu': 0 }, hard: { 'limits.cpu': 2 } },
        },
        {
          namespace: 'test-namespace2',
          status: { used: { 'limits.cpu': 1 }, hard: { 'limits.cpu': 2 } },
        },
      ],
      total: { hard: { 'limits.cpu': 2 }, used: { 'limits.cpu': 1 } },
    },
  };

  it('verifies applied cluster resource quota information with namespace context', () => {
    renderWithProviders(
      <table>
        <tbody>
          <ResourceUsageRow resourceType={'limits.cpu'} quota={quota} namespace="test-namespace" />
        </tbody>
      </table>,
    );

    // Verify the resource type
    expect(screen.getByText('limits.cpu')).toBeVisible();

    // Verify usage icon is visible to users
    expect(screen.getByRole('img', { hidden: true })).toBeVisible();

    // Verify the namespace usage
    expect(screen.getByText('0')).toBeVisible();

    // Verify the total cluster usage
    expect(screen.getByText('1')).toBeVisible();

    // Verify the limit
    expect(screen.getByText('2')).toBeVisible();
  });
});
