import { render, screen } from '@testing-library/react';
import type { NodeKind } from '@console/internal/module/k8s';
import { getNodeRoles } from '@console/shared/src/selectors/node';
import NodeRoles from '../NodeRoles';

jest.mock('@console/shared/src/selectors/node', () => ({
  getNodeRoles: jest.fn(),
}));

const mockGetNodeRoles = getNodeRoles as jest.Mock;

describe('NodeRoles', () => {
  const createMockNode = (): NodeKind =>
    ({
      apiVersion: 'v1',
      kind: 'Node',
      metadata: { name: 'test-node' },
    } as NodeKind);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display single role', () => {
    mockGetNodeRoles.mockReturnValue(['worker']);

    render(<NodeRoles node={createMockNode()} />);

    expect(screen.getByText('worker')).toBeVisible();
  });

  it('should display multiple roles sorted alphabetically', () => {
    mockGetNodeRoles.mockReturnValue(['worker', 'infra', 'control-plane']);

    render(<NodeRoles node={createMockNode()} />);

    expect(screen.getByText('control-plane, infra, worker')).toBeVisible();
  });

  it('should display dash when no roles', () => {
    mockGetNodeRoles.mockReturnValue([]);

    render(<NodeRoles node={createMockNode()} />);

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display dash when node is undefined', () => {
    mockGetNodeRoles.mockReturnValue([]);

    render(<NodeRoles node={undefined} />);

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should handle master and worker roles', () => {
    mockGetNodeRoles.mockReturnValue(['master', 'worker']);

    render(<NodeRoles node={createMockNode()} />);

    expect(screen.getByText('master, worker')).toBeVisible();
  });
});
