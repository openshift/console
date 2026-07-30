// Assisted-by: Claude
import { render } from '@testing-library/react';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { NodeSubNavPage } from '../../NodeSubNavPage';
import { NodeHealth, HEALTH_PAGE_ID } from '../NodeHealth';

jest.mock('../../NodeSubNavPage', () => ({
  NodeSubNavPage: jest.fn(() => null),
}));

jest.mock('../NodePerformance', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../../NodeLogs', () => ({
  __esModule: true,
  default: jest.fn(() => null),
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

describe('NodeHealth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render NodeSubNavPage component', () => {
    render(<NodeHealth obj={mockNode} />);

    expect(NodeSubNavPage).toHaveBeenCalled();
  });

  it('should pass the node object to NodeSubNavPage', () => {
    render(<NodeHealth obj={mockNode} />);

    expect(NodeSubNavPage).toHaveBeenCalledWith(
      expect.objectContaining({
        obj: mockNode,
      }),
      expect.any(Object),
    );
  });

  it('should pass the health page ID to NodeSubNavPage', () => {
    render(<NodeHealth obj={mockNode} />);

    expect(NodeSubNavPage).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: HEALTH_PAGE_ID,
      }),
      expect.any(Object),
    );
  });

  it('should configure standard pages with performance and logs tabs', () => {
    render(<NodeHealth obj={mockNode} />);

    const call = (NodeSubNavPage as jest.Mock).mock.calls[0][0];
    expect(call.standardPages).toHaveLength(2);
  });

  it('should configure performance tab with correct properties', () => {
    render(<NodeHealth obj={mockNode} />);

    const call = (NodeSubNavPage as jest.Mock).mock.calls[0][0];
    const performanceTab = call.standardPages.find((page) => page.tabId === 'performance');

    expect(performanceTab).toMatchObject({
      tabId: 'performance',
      nameKey: 'console-app~Performance',
      priority: 70,
    });
    expect(typeof performanceTab.component).toBe('function');
  });

  it('should configure logs tab with correct properties', () => {
    render(<NodeHealth obj={mockNode} />);

    const call = (NodeSubNavPage as jest.Mock).mock.calls[0][0];
    const logsTab = call.standardPages.find((page) => page.tabId === 'logs');

    expect(logsTab).toMatchObject({
      tabId: 'logs',
      nameKey: 'console-app~Logs',
      priority: 30,
    });
    expect(typeof logsTab.component).toBe('function');
  });
});
