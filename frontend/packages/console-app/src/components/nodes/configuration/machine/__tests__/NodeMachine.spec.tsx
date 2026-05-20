import { screen } from '@testing-library/react';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import { MachineConfigPoolModel, MachineModel } from '@console/internal/models';
import type { NodeKind } from '@console/internal/module/k8s';
import { getNodeMachineNameAndNamespace } from '@console/shared/src/selectors/node';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import NodeMachine from '../NodeMachine';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/hooks', () => {
  const actual = jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/hooks');
  return {
    ...actual,
    useK8sWatchResource: jest.fn(),
  };
});

jest.mock('@console/internal/components/utils', () => {
  const actual = jest.requireActual('@console/internal/components/utils');
  return {
    ...actual,
    SectionHeading: jest.fn(({ text }) => <h2>{text}</h2>),
    WorkloadPausedAlert: jest.fn(() => <div>Workload paused alert</div>),
  };
});

jest.mock('../BMCConfiguration', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@console/shared/src/selectors/node', () => ({
  getNodeMachineNameAndNamespace: jest.fn(),
}));

const getNodeMachineNameAndNamespaceMock = getNodeMachineNameAndNamespace as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

const isMachineConfigPoolListWatch = (resource: unknown): boolean =>
  Boolean(
    resource &&
      typeof resource === 'object' &&
      'isList' in resource &&
      (resource as { isList?: boolean }).isList &&
      (resource as { groupVersionKind?: { kind?: string } }).groupVersionKind?.kind ===
        MachineConfigPoolModel.kind,
  );

const isMachineWatch = (resource: unknown): boolean =>
  Boolean(
    resource &&
      typeof resource === 'object' &&
      !('isList' in resource && (resource as { isList?: boolean }).isList) &&
      (resource as { groupVersionKind?: { kind?: string } }).groupVersionKind?.kind ===
        MachineModel.kind,
  );

describe('NodeMachine', () => {
  const mockNode: NodeKind = {
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name: 'test-node',
      uid: 'test-uid',
      labels: {
        'node-role.kubernetes.io/worker': '',
      },
    },
    spec: {},
    status: {},
  };

  const mockMachine = {
    apiVersion: 'machine.openshift.io/v1beta1',
    kind: 'Machine',
    metadata: {
      name: 'test-machine',
      namespace: 'openshift-machine-api',
      uid: 'machine-uid',
    },
    spec: {},
    status: {},
  };

  const mockMachineConfigPool = {
    apiVersion: 'machineconfiguration.openshift.io/v1',
    kind: 'MachineConfigPool',
    metadata: {
      name: 'test-mcp',
      uid: 'mcp-uid',
    },
    spec: {
      nodeSelector: {
        matchLabels: {
          'node-role.kubernetes.io/worker': '',
        },
      },
      paused: false,
    },
    status: {
      configuration: {
        name: 'worker',
      },
    },
  };

  const defaultMcpList = [mockMachineConfigPool];

  const setupWatchMocks = (options: {
    mcp?: [unknown, boolean, unknown];
    machine?: [unknown, boolean, unknown];
  }) => {
    const mcpReturn = options.mcp ?? [defaultMcpList, true, undefined];
    const machineReturn = options.machine ?? [mockMachine, true, undefined];
    useK8sWatchResourceMock.mockImplementation((resource) => {
      if (resource === null) {
        return [null, false, undefined];
      }
      if (isMachineConfigPoolListWatch(resource)) {
        return mcpReturn;
      }
      if (isMachineWatch(resource)) {
        return machineReturn;
      }
      return [null, true, undefined];
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getNodeMachineNameAndNamespaceMock.mockReturnValue(['test-machine', 'openshift-machine-api']);
    useK8sWatchResourceMock.mockReset();
  });

  it('should display error message when machine config pool fails to load', () => {
    setupWatchMocks({
      mcp: [null, true, new Error('Failed to load')],
      machine: [mockMachine, true, undefined],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('MachineConfigPools are not available')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('should display message when machine config pool is not found', () => {
    setupWatchMocks({
      mcp: [[], true, undefined],
      machine: [mockMachine, true, undefined],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('This node has no associated MachineConfigPool.')).toBeInTheDocument();
  });

  it('should display machine config pool details when loaded', () => {
    setupWatchMocks({
      mcp: [defaultMcpList, true, undefined],
      machine: [mockMachine, true, undefined],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('test-mcp')).toBeInTheDocument();
    expect(screen.getByText('MachineConfigs')).toBeInTheDocument();
  });

  it('should display paused alert when machine config pool is paused', () => {
    const pausedMcp = {
      ...mockMachineConfigPool,
      spec: {
        ...mockMachineConfigPool.spec,
        paused: true,
      },
    };
    setupWatchMocks({
      mcp: [[pausedMcp], true, undefined],
      machine: [mockMachine, true, undefined],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('Workload paused alert')).toBeInTheDocument();
  });

  it('should show loading skeleton in machine details while machine is loading', () => {
    setupWatchMocks({
      mcp: [defaultMcpList, true, undefined],
      machine: [null, false, undefined],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByTestId('skeleton-detail-view')).toBeInTheDocument();
  });

  it('should show skeleton for machine config pool section while pools are loading', () => {
    setupWatchMocks({
      mcp: [null, false, undefined],
      machine: [mockMachine, true, undefined],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByTestId('skeleton-detail-view')).toBeInTheDocument();
  });

  it('should display error message when machine fails to load', () => {
    setupWatchMocks({
      machine: [null, true, new Error('Failed to load')],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('Machine is not available')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('should display message when machine is not found', () => {
    setupWatchMocks({
      machine: [null, true, undefined],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('This node has no associated machine.')).toBeInTheDocument();
  });

  it('should display machine details when machine is loaded', () => {
    setupWatchMocks({
      machine: [mockMachine, true, undefined],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('test-machine')).toBeInTheDocument();
  });

  it('should not watch machine when node has no machine annotation', () => {
    getNodeMachineNameAndNamespaceMock.mockReturnValue([null, null]);
    setupWatchMocks({
      machine: [null, false, undefined],
    });

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
  });
});
