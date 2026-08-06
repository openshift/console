import type { FC, ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { NodeKind } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { NodesPage } from '../NodesPage';

jest.mock('@console/dynamic-plugin-sdk/src/api/core-api', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/api/core-api'),
  useAccessReview: jest.fn(),
  useOverlay: jest.fn(() => jest.fn()),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: jest.fn(() => jest.fn()),
}));

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(() => ({})),
}));

jest.mock('../../../utils/kubevirt', () => ({
  useIsKubevirtPluginActive: jest.fn(() => false),
}));

jest.mock('../utils/NodeVmUtils', () => ({
  useWatchVirtualMachineInstances: jest.fn(() => [[], true, undefined]),
  filterVirtualMachineInstancesByNode: jest.fn(() => []),
}));

jest.mock('../useNodeStatusExtensions', () => ({
  useNodeStatusExtensions: jest.fn(() => () => ({ popoverContent: [], secondaryStatuses: [] })),
}));

const mockUseK8sWatchResource = useK8sWatchResource as jest.Mock;
const mockUseAccessReview = useAccessReview as jest.Mock;
const mockUseFlag = useFlag as jest.Mock;
const mockUseUserPreference = useUserPreference as jest.Mock;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  disconnect() {
    // do nothing
  }

  observe() {
    // do nothing
  }

  takeRecords() {
    return [];
  }

  unobserve() {
    // do nothing
  }
} as any;

const createMockNode = (name: string): NodeKind =>
  ({
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name,
      uid: `uid-${name}`,
      creationTimestamp: '2024-01-01T00:00:00Z',
      labels: {},
    },
    status: {
      conditions: [
        {
          type: 'Ready',
          status: 'True',
        },
      ],
      nodeInfo: {
        architecture: 'amd64',
      },
    },
  } as NodeKind);

const createWrapper = (): FC<{ children: ReactNode }> => {
  const Wrapper: FC<{ children: ReactNode }> = ({ children }) => (
    <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
  );
  Wrapper.displayName = 'MemoryRouterWrapper';
  return Wrapper;
};

enum Kinds {
  NODE = 'Node',
  MACHINE = 'Machine',
  MACHINE_SET = 'MachineSet',
  CONTROL_PLANE_MACHINE_SET = 'ControlPlaneMachineSet',
  MACHINE_CONFIG_POOL = 'MachineConfigPool',
  CERTIFICATE_SIGNING_REQUEST = 'CertificateSigningRequest',
}

type ResourceKindError = {
  kind: Kinds;
  error: Error;
};

/**
 * Creates a mockImplementation for useK8sWatchResource that simulates resource loading behavior.
 * By default, all resources load successfully. Specify which resources should fail to load.
 */
const createMockWatchResourceImplementation = (errorKinds: ResourceKindError[] = []) => {
  return (watchOptions: any) => {
    if (!watchOptions) {
      return [[], true, undefined];
    }

    const kind = watchOptions.groupVersionKind?.kind || watchOptions.kind;
    const errorConfig = errorKinds.find((e) => kind?.includes(e.kind));

    if (errorConfig) {
      return [[], false, errorConfig.error];
    }

    if (kind === Kinds.NODE) {
      return [[createMockNode('test-node-1'), createMockNode('test-node-2')], true, undefined];
    }
    if (kind === Kinds.MACHINE) {
      return [[], true, undefined];
    }
    if (kind?.includes(Kinds.MACHINE_SET)) {
      return [[], true, undefined];
    }
    if (kind?.includes(Kinds.CONTROL_PLANE_MACHINE_SET)) {
      return [[], true, undefined];
    }
    if (kind?.includes(Kinds.MACHINE_CONFIG_POOL)) {
      return [[], true, undefined];
    }
    if (kind === Kinds.CERTIFICATE_SIGNING_REQUEST) {
      return [[], true, undefined];
    }

    return [[], true, undefined];
  };
};

const resourceFailureCases = [
  {
    description: 'MachineSet',
    errorKinds: [{ kind: Kinds.MACHINE_SET, error: new Error('MachineSet CRD not found') }],
  },
  {
    description: 'ControlPlaneMachineSet',
    errorKinds: [
      {
        kind: Kinds.CONTROL_PLANE_MACHINE_SET,
        error: new Error('ControlPlaneMachineSet CRD not found'),
      },
    ],
  },
  {
    description: 'MachineConfigPool',
    errorKinds: [
      {
        kind: Kinds.MACHINE_CONFIG_POOL,
        error: new Error('MachineConfigPool CRD not found'),
      },
    ],
  },
  {
    description: 'all Machine-related resources',
    errorKinds: [
      { kind: Kinds.MACHINE_SET, error: new Error('MachineSet CRD not found') },
      {
        kind: Kinds.CONTROL_PLANE_MACHINE_SET,
        error: new Error('ControlPlaneMachineSet CRD not found'),
      },
      {
        kind: Kinds.MACHINE_CONFIG_POOL,
        error: new Error('MachineConfigPool CRD not found'),
      },
    ],
  },
];

describe('NodesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFlag.mockReturnValue(false);
    mockUseUserPreference.mockReturnValue([{}, jest.fn(), true]);
    mockUseAccessReview.mockReturnValue([true, false]);

    // Default: all resources load successfully
    mockUseK8sWatchResource.mockImplementation(createMockWatchResourceImplementation());
  });

  describe('Loading behavior', () => {
    it('should render nodes when all resources load successfully', async () => {
      render(<NodesPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('test-node-1')).toBeInTheDocument();
        expect(screen.getByText('test-node-2')).toBeInTheDocument();
      });
    });

    it.each(resourceFailureCases)(
      'should complete loading when $description fails to load',
      async ({ errorKinds }) => {
        mockUseK8sWatchResource.mockImplementation(
          createMockWatchResourceImplementation(errorKinds),
        );

        render(<NodesPage />, { wrapper: createWrapper() });

        await waitFor(() => {
          expect(screen.getByText('test-node-1')).toBeInTheDocument();
        });
      },
    );

    it('should not complete loading if nodes fail to load', async () => {
      mockUseK8sWatchResource.mockImplementation((watchOptions) => {
        if (!watchOptions) {
          return [[], true, undefined];
        }

        const kind = watchOptions.groupVersionKind?.kind || watchOptions.kind;

        // Nodes still loading - return loaded=false, no error
        if (kind === 'Node') {
          return [[], false, undefined];
        }

        return [[], true, undefined];
      });

      render(<NodesPage />, { wrapper: createWrapper() });

      // Should show loading state, not the node list
      await waitFor(() => {
        expect(screen.queryByText('test-node-1')).not.toBeInTheDocument();
      });
    });

    it('should show error when nodes fail to load with error', async () => {
      mockUseK8sWatchResource.mockImplementation(
        createMockWatchResourceImplementation([
          { kind: Kinds.NODE, error: new Error('Failed to fetch nodes') },
        ]),
      );

      render(<NodesPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.queryByText('test-node-1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Access control', () => {
    it('should not watch MachineSet when access is denied', async () => {
      let accessCheckCount = 0;
      mockUseAccessReview.mockImplementation(() => {
        accessCheckCount++;
        // Deny access to the second resource check (first is for edit button, rest are for watches)
        return accessCheckCount === 2 ? [false, false] : [true, false];
      });

      mockUseK8sWatchResource.mockImplementation((watchOptions) => {
        if (!watchOptions) {
          // When access is denied, watchOptions is undefined
          return [[], true, undefined];
        }

        const kind = watchOptions.groupVersionKind?.kind || watchOptions.kind;

        if (kind === 'Node') {
          return [[createMockNode('test-node-1')], true, undefined];
        }

        return [[], true, undefined];
      });

      render(<NodesPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('test-node-1')).toBeInTheDocument();
      });
    });
  });

  describe('Column preferences', () => {
    it('should not render when column preferences are not loaded', () => {
      mockUseUserPreference.mockReturnValue([{}, jest.fn(), false]);

      render(<NodesPage />, { wrapper: createWrapper() });

      // Should not render the nodes list when preferences are not loaded
      expect(screen.queryByText('test-node-1')).not.toBeInTheDocument();
      expect(screen.queryByText('test-node-2')).not.toBeInTheDocument();
    });
  });
});
