import { render, screen } from '@testing-library/react';
import type { NodeKind } from '@console/internal/module/k8s';
import NodeDetailsConditions from '../NodeDetailsConditions';

jest.mock('@console/internal/components/utils/headings', () => ({
  SectionHeading: jest.fn(({ text }: { text: string }) => text),
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: jest.fn(({ children }: { children: React.ReactNode }) => children),
}));

jest.mock('@console/shared/src/components/datetime/Timestamp', () => ({
  Timestamp: jest.fn(({ timestamp }: { timestamp: string }) => timestamp),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  CamelCaseWrap: jest.fn(({ value }: { value: string }) => value),
}));

describe('NodeDetailsConditions', () => {
  const createMockNode = (conditions: any[] = []): NodeKind =>
    ({
      apiVersion: 'v1',
      kind: 'Node',
      metadata: {
        name: 'test-node',
      },
      status: {
        conditions,
      },
    } as NodeKind);

  it('should render section heading', () => {
    const node = createMockNode([]);
    render(<NodeDetailsConditions node={node} />);

    expect(screen.getByText('Node conditions')).toBeVisible();
  });

  it('should render a table with five column headers', () => {
    const node = createMockNode([
      {
        type: 'Ready',
        status: 'True',
        reason: 'KubeletReady',
        lastHeartbeatTime: '2024-01-15T10:00:00Z',
        lastTransitionTime: '2024-01-15T10:00:00Z',
      },
    ]);
    render(<NodeDetailsConditions node={node} />);

    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders).toHaveLength(5);
    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Reason' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Updated' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Changed' })).toBeVisible();
  });

  it('should render the correct number of rows for conditions', () => {
    const node = createMockNode([
      {
        type: 'Ready',
        status: 'True',
        reason: 'KubeletReady',
        lastHeartbeatTime: '2024-01-15T10:00:00Z',
        lastTransitionTime: '2024-01-15T10:00:00Z',
      },
      {
        type: 'MemoryPressure',
        status: 'False',
        reason: 'KubeletHasSufficientMemory',
        lastHeartbeatTime: '2024-01-15T09:00:00Z',
        lastTransitionTime: '2024-01-15T09:00:00Z',
      },
    ]);
    render(<NodeDetailsConditions node={node} />);

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3);
  });

  it('should render condition type', () => {
    const node = createMockNode([
      {
        type: 'Ready',
        status: 'True',
        reason: 'KubeletReady',
        message: 'kubelet is posting ready status',
        lastTransitionTime: '2024-01-15T10:00:00Z',
      },
    ]);
    render(<NodeDetailsConditions node={node} />);

    expect(screen.getByText('Ready')).toBeVisible();
  });

  it('should render condition status', () => {
    const node = createMockNode([
      {
        type: 'Ready',
        status: 'True',
        reason: 'KubeletReady',
        message: 'kubelet is posting ready status',
        lastTransitionTime: '2024-01-15T10:00:00Z',
      },
    ]);
    render(<NodeDetailsConditions node={node} />);

    expect(screen.getByText('True')).toBeVisible();
  });

  it('should render condition reason', () => {
    const node = createMockNode([
      {
        type: 'Ready',
        status: 'True',
        reason: 'KubeletReady',
        message: 'kubelet is posting ready status',
        lastTransitionTime: '2024-01-15T10:00:00Z',
      },
    ]);
    render(<NodeDetailsConditions node={node} />);

    expect(screen.getByText('KubeletReady')).toBeVisible();
  });

  it('should render last transition time', () => {
    const node = createMockNode([
      {
        type: 'Ready',
        status: 'True',
        reason: 'KubeletReady',
        message: 'kubelet is posting ready status',
        lastTransitionTime: '2024-01-15T10:00:00Z',
      },
    ]);
    render(<NodeDetailsConditions node={node} />);

    expect(screen.getByText('2024-01-15T10:00:00Z')).toBeVisible();
  });

  it('should render multiple conditions', () => {
    const node = createMockNode([
      {
        type: 'Ready',
        status: 'True',
        reason: 'KubeletReady',
        message: 'Ready message',
        lastTransitionTime: '2024-01-15T10:00:00Z',
      },
      {
        type: 'MemoryPressure',
        status: 'False',
        reason: 'KubeletHasSufficientMemory',
        message: 'No memory pressure',
        lastTransitionTime: '2024-01-15T09:00:00Z',
      },
    ]);
    render(<NodeDetailsConditions node={node} />);

    expect(screen.getByText('Ready')).toBeVisible();
    expect(screen.getByText('MemoryPressure')).toBeVisible();
  });

  it('should render empty state when no conditions', () => {
    const node = createMockNode([]);
    render(<NodeDetailsConditions node={node} />);

    expect(screen.getByText('Node conditions')).toBeVisible();
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
  });
});
