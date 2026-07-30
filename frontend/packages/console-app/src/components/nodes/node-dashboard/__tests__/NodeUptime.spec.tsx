import { render, screen } from '@testing-library/react';
import type { NodeKind } from '@console/internal/module/k8s';
import { getNodeUptime } from '@console/shared/src/selectors/node';
import NodeUptime from '../NodeUptime';

jest.mock('@console/shared/src/selectors/node', () => ({
  getNodeUptime: jest.fn(),
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: ({ timestamp }: { timestamp: string }) => <span>{timestamp || 'No timestamp'}</span>,
}));

const mockGetNodeUptime = getNodeUptime as jest.Mock;

describe('NodeUptime', () => {
  const createMockNode = (): NodeKind =>
    ({
      apiVersion: 'v1',
      kind: 'Node',
      metadata: { name: 'test-node' },
      status: {
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            lastTransitionTime: '2024-01-15T10:00:00Z',
          },
        ],
      },
    } as NodeKind);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display timestamp from node uptime', () => {
    mockGetNodeUptime.mockReturnValue('2024-01-15T10:00:00Z');

    render(<NodeUptime obj={createMockNode()} />);

    expect(screen.getByText('2024-01-15T10:00:00Z')).toBeVisible();
  });

  it('should pass node object to getNodeUptime', () => {
    const node = createMockNode();
    mockGetNodeUptime.mockReturnValue('2024-01-15T10:00:00Z');

    render(<NodeUptime obj={node} />);

    expect(mockGetNodeUptime).toHaveBeenCalledWith(node);
  });

  it('should handle undefined uptime gracefully', () => {
    mockGetNodeUptime.mockReturnValue(undefined);

    render(<NodeUptime obj={createMockNode()} />);

    expect(screen.getByText('No timestamp')).toBeVisible();
  });

  it('should handle empty string uptime', () => {
    mockGetNodeUptime.mockReturnValue('');

    render(<NodeUptime obj={createMockNode()} />);

    expect(screen.getByText('No timestamp')).toBeVisible();
  });

  it('should render with different timestamp formats', () => {
    mockGetNodeUptime.mockReturnValue('2023-12-25T00:00:00Z');

    render(<NodeUptime obj={createMockNode()} />);

    expect(screen.getByText('2023-12-25T00:00:00Z')).toBeVisible();
  });
});
