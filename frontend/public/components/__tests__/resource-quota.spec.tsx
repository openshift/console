import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import '@testing-library/jest-dom';
import { UsageIcon, ResourceUsageRow, getACRQResourceUsage } from '../resource-quota';

// We don't renderWithProviders ResourceUsageRows for cluster-only data, but use it in a Gauge chart
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
    const { container } = renderWithProviders(<UsageIcon percent={0} />);

    // User should see an icon representing empty usage
    const icon = container.firstChild as Element;
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders an icon for low usage (1%)', () => {
    const { container } = renderWithProviders(<UsageIcon percent={1} />);

    // User should see an icon representing low usage
    const icon = container.firstChild as Element;
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders an icon for moderate low usage (49%)', () => {
    const { container } = renderWithProviders(<UsageIcon percent={49} />);

    // User should see an icon representing moderate low usage
    const icon = container.firstChild as Element;
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders an icon for moderate usage (50%)', () => {
    const { container } = renderWithProviders(<UsageIcon percent={50} />);

    // User should see an icon representing moderate usage
    const icon = container.firstChild as Element;
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders an icon for high usage (99%)', () => {
    const { container } = renderWithProviders(<UsageIcon percent={99} />);

    // User should see an icon representing high usage
    const icon = container.firstChild as Element;
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders an icon for complete usage (100%)', () => {
    const { container } = renderWithProviders(<UsageIcon percent={100} />);

    // User should see an icon representing full usage
    const icon = container.firstChild as Element;
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
  });

  it('renders a warning icon for over-usage (101%)', () => {
    const { container } = renderWithProviders(<UsageIcon percent={101} />);

    // User should see a warning icon for exceeded usage
    const icon = container.firstChild as Element;
    expect(icon).toBeInTheDocument();
    expect(icon.tagName.toLowerCase()).toBe('svg');
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

  it('displays resource quota information in table columns', () => {
    const { container } = renderWithProviders(
      <table>
        <tbody>
          <ResourceUsageRow resourceType={'limits.cpu'} quota={quota} />
        </tbody>
      </table>,
    );

    expect(screen.getByText('limits.cpu')).toBeInTheDocument();

    // User should see a usage icon (SVG element)
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();

    // User should see current usage (1)
    expect(screen.getByText('1')).toBeInTheDocument();

    // User should see limit (2)
    expect(screen.getByText('2')).toBeInTheDocument();
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

  it('displays cluster resource quota information in table columns', () => {
    const { container } = renderWithProviders(
      <table>
        <tbody>
          <ResourceUsageRow resourceType={'limits.cpu'} quota={quota} />
        </tbody>
      </table>,
    );

    // User should see the resource type
    expect(screen.getByText('limits.cpu')).toBeInTheDocument();

    // User should see a usage icon (SVG element)
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();

    // User should see current usage (1)
    expect(screen.getByText('1')).toBeInTheDocument();

    // User should see limit (2)
    expect(screen.getByText('2')).toBeInTheDocument();
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

  it('displays applied cluster resource quota information with namespace context', () => {
    const { container } = renderWithProviders(
      <table>
        <tbody>
          <ResourceUsageRow resourceType={'limits.cpu'} quota={quota} namespace="test-namespace" />
        </tbody>
      </table>,
    );

    // User should see the resource type
    expect(screen.getByText('limits.cpu')).toBeInTheDocument();

    // User should see a usage icon (SVG element)
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();

    // User should see namespace usage (0 for test-namespace)
    expect(screen.getByText('0')).toBeInTheDocument();

    // User should see total cluster usage (1)
    expect(screen.getByText('1')).toBeInTheDocument();

    // User should see the limit (2)
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
