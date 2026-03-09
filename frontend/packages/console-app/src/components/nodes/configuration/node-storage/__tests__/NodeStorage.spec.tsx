import { render, screen } from '@testing-library/react';
import type { NodeKind } from '@console/internal/module/k8s';
import NodeStorage from '../NodeStorage';

jest.mock('../LocalDisks', () => ({
  __esModule: true,
  default: jest.fn(({ node }) => <div>LocalDisks for {node.metadata.name}</div>),
}));

jest.mock('../PersistentVolumes', () => ({
  __esModule: true,
  default: jest.fn(({ node }) => <div>PersistentVolumes for {node.metadata.name}</div>),
}));

describe('NodeStorage', () => {
  const mockNode: NodeKind = {
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name: 'test-node',
      uid: 'test-uid',
    },
    spec: {},
    status: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render LocalDisks component', () => {
    render(<NodeStorage obj={mockNode} />);

    expect(screen.getByText('LocalDisks for test-node')).toBeInTheDocument();
  });

  it('should render PersistentVolumes component', () => {
    render(<NodeStorage obj={mockNode} />);

    expect(screen.getByText('PersistentVolumes for test-node')).toBeInTheDocument();
  });
});
