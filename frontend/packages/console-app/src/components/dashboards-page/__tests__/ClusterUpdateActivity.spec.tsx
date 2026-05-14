import { render, screen } from '@testing-library/react';
import type { ClusterVersionKind } from '@console/internal/module/k8s';
import ClusterUpdateActivity from '../ClusterUpdateActivity';

jest.mock('@console/shared/src/components/dashboard/activity-card/ActivityItem', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ClusterUpdateActivity', () => {
  const createMockClusterVersion = (version: string): ClusterVersionKind =>
    ({
      apiVersion: 'config.openshift.io/v1',
      kind: 'ClusterVersion',
      metadata: {
        name: 'version',
      },
      status: {
        history: [
          {
            version,
            state: 'Partial',
            startedTime: '2024-01-15T10:00:00Z',
          },
        ],
      },
    } as ClusterVersionKind);

  it('should render update message with version number', () => {
    const resource = createMockClusterVersion('4.15.0');
    render(<ClusterUpdateActivity resource={resource} />);

    expect(screen.getByText('Updating cluster to 4.15.0')).toBeVisible();
  });

  it('should display different version numbers correctly', () => {
    const resource = createMockClusterVersion('4.16.0-rc.1');
    render(<ClusterUpdateActivity resource={resource} />);

    expect(screen.getByText('Updating cluster to 4.16.0-rc.1')).toBeVisible();
  });

  it('should handle empty history gracefully', () => {
    const resource: ClusterVersionKind = {
      apiVersion: 'config.openshift.io/v1',
      kind: 'ClusterVersion',
      metadata: { name: 'version' },
      status: {
        history: [],
      },
    } as ClusterVersionKind;

    render(<ClusterUpdateActivity resource={resource} />);

    expect(screen.getByText('Updating cluster to')).toBeVisible();
  });

  it('should update the message when the resource version changes', () => {
    const resource1 = createMockClusterVersion('4.15.0');
    const { rerender } = render(<ClusterUpdateActivity resource={resource1} />);

    expect(screen.getByText('Updating cluster to 4.15.0')).toBeVisible();

    const resource2 = createMockClusterVersion('4.15.1');
    rerender(<ClusterUpdateActivity resource={resource2} />);

    expect(screen.getByText('Updating cluster to 4.15.1')).toBeVisible();
  });
});
