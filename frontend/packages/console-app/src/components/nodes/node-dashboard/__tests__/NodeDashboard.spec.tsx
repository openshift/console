import { render } from '@testing-library/react';
import type { NodeKind } from '@console/internal/module/k8s';
import * as DashboardGridModule from '@console/shared/src/components/dashboard/DashboardGrid';
import NodeDashboard from '../NodeDashboard';

jest.mock('@console/shared/src/components/dashboard/Dashboard', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('@console/shared/src/components/dashboard/DashboardGrid', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

const mockNode: NodeKind = {
  apiVersion: 'v1',
  kind: 'Node',
  metadata: {
    name: 'test-node',
    uid: 'test-node-uid',
    resourceVersion: '12345',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {},
  status: {
    conditions: [],
    addresses: [],
  },
};

describe('NodeDashboard', () => {
  beforeEach(() => {
    jest.spyOn(DashboardGridModule, 'default').mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('when rendering with node object', () => {
    it('should render Dashboard with DashboardGrid', () => {
      render(<NodeDashboard obj={mockNode} />);

      expect(DashboardGridModule.default).toHaveBeenCalled();
    });

    it('should pass mainCards and leftCards to DashboardGrid', () => {
      render(<NodeDashboard obj={mockNode} />);

      expect(DashboardGridModule.default).toHaveBeenCalledWith(
        expect.objectContaining({
          mainCards: expect.arrayContaining([
            expect.objectContaining({ Card: expect.any(Function) }),
          ]),
          leftCards: expect.arrayContaining([
            expect.objectContaining({ Card: expect.any(Function) }),
          ]),
        }),
        expect.any(Object),
      );
    });

    it('should not pass rightCards to DashboardGrid', () => {
      render(<NodeDashboard obj={mockNode} />);

      expect(DashboardGridModule.default).toHaveBeenCalledWith(
        expect.objectContaining({
          mainCards: expect.any(Array),
          leftCards: expect.any(Array),
        }),
        expect.any(Object),
      );
      const props = jest.mocked(DashboardGridModule.default).mock.calls[0][0];
      expect(props.rightCards).toBeUndefined();
    });
  });
});
