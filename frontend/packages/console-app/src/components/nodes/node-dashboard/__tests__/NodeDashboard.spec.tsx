import { render } from '@testing-library/react';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import type { NodeKind } from '@console/internal/module/k8s';
import * as DashboardGridModule from '@console/shared/src/components/dashboard/DashboardGrid';
import ActivityCard from '../ActivityCard';
import NodeDashboard from '../NodeDashboard';

jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => ({
  useFlag: jest.fn(),
}));

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
    jest.spyOn(flagsModule, 'useFlag').mockReturnValue(false);
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
  });

  describe('when NODE_MGMT_V1 flag is disabled', () => {
    it('should pass rightCards, mainCards, and leftCards to DashboardGrid', () => {
      jest.spyOn(flagsModule, 'useFlag').mockReturnValue(false);

      render(<NodeDashboard obj={mockNode} />);

      expect(DashboardGridModule.default).toHaveBeenCalledWith(
        expect.objectContaining({
          rightCards: [{ Card: ActivityCard }],
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
  });

  describe('when NODE_MGMT_V1 flag is enabled', () => {
    it('should not pass rightCards to DashboardGrid', () => {
      jest.spyOn(flagsModule, 'useFlag').mockReturnValue(true);

      render(<NodeDashboard obj={mockNode} />);

      expect(DashboardGridModule.default).toHaveBeenCalledWith(
        expect.objectContaining({
          rightCards: undefined,
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
  });
});
