// Assisted-by: Claude
import { render } from '@testing-library/react';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { NodeSubNavPage } from '../NodeSubNavPage';
import { NodeWorkload } from '../NodeWorkload';

jest.mock('../NodeSubNavPage', () => ({
  NodeSubNavPage: jest.fn(() => null),
}));

jest.mock('@console/internal/components/pod-list', () => ({
  PodsPage: jest.fn(() => null),
}));

const mockNode: NodeKind = {
  apiVersion: 'v1',
  kind: 'Node',
  metadata: {
    name: 'test-node',
    uid: 'test-node-uid',
  },
  spec: {},
  status: {
    conditions: [],
  },
};

describe('NodeWorkload', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render NodeSubNavPage component', () => {
    render(<NodeWorkload obj={mockNode} />);

    expect(NodeSubNavPage).toHaveBeenCalled();
  });

  it('should pass the node object to NodeSubNavPage', () => {
    render(<NodeWorkload obj={mockNode} />);

    expect(NodeSubNavPage).toHaveBeenCalledWith(
      expect.objectContaining({
        obj: mockNode,
      }),
      expect.any(Object),
    );
  });

  it('should pass the workload page ID to NodeSubNavPage', () => {
    render(<NodeWorkload obj={mockNode} />);

    expect(NodeSubNavPage).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: 'workload',
      }),
      expect.any(Object),
    );
  });

  it('should configure standard pages with pods tab', () => {
    render(<NodeWorkload obj={mockNode} />);

    const call = (NodeSubNavPage as jest.Mock).mock.calls[0][0];
    expect(call.standardPages).toHaveLength(1);
    expect(call.standardPages[0]).toMatchObject({
      tabId: 'pods',
      nameKey: 'console-app~Pods',
      priority: 30,
    });
    expect(typeof call.standardPages[0].component).toBe('function');
  });
});
