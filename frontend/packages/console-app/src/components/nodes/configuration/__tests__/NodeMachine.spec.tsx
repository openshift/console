import { screen } from '@testing-library/react';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
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

jest.mock('@console/internal/components/machine', () => ({
  MachineDetails: jest.fn(({ obj }) => <div>Machine details for {obj.metadata.name}</div>),
}));

jest.mock('@console/internal/components/machine-config-pool', () => ({
  MachineConfigPoolSummary: jest.fn(() => <div>MachineConfigPool summary</div>),
}));

jest.mock('@console/internal/components/utils', () => {
  const actual = jest.requireActual('@console/internal/components/utils');
  return {
    ...actual,
    PageComponentProps: {},
    SectionHeading: jest.fn(({ text }) => <h2>{text}</h2>),
    WorkloadPausedAlert: jest.fn(() => <div>Workload paused alert</div>),
  };
});

jest.mock('@console/shared/src/selectors/node', () => ({
  getNodeMachineNameAndNamespace: jest.fn(),
}));

const getNodeMachineNameAndNamespaceMock = getNodeMachineNameAndNamespace as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

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
      configuration: {},
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getNodeMachineNameAndNamespaceMock.mockReturnValue(['test-machine', 'openshift-machine-api']);
  });

  it('should show loading skeleton when data is loading', () => {
    useK8sWatchResourceMock.mockReturnValue([null, false, undefined]);

    const { container } = renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(container.querySelector('[data-test="skeleton-detail-view"]')).toBeInTheDocument();
  });

  it('should display error message when machine fails to load', () => {
    useK8sWatchResourceMock
      .mockReturnValueOnce([null, true, new Error('Failed to load')])
      .mockReturnValueOnce([[], true, undefined]);

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('Error loading machine')).toBeInTheDocument();
  });

  it('should display message when machine is not found', () => {
    useK8sWatchResourceMock
      .mockReturnValueOnce([null, true, undefined])
      .mockReturnValueOnce([[], true, undefined]);

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('There is no machine associated with this node')).toBeInTheDocument();
  });

  it('should display machine details when machine is loaded', () => {
    useK8sWatchResourceMock
      .mockReturnValueOnce([mockMachine, true, undefined])
      .mockReturnValueOnce([[mockMachineConfigPool], true, undefined]);

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('test-machine')).toBeInTheDocument();
  });

  it('should display error message when machine config pool fails to load', () => {
    useK8sWatchResourceMock
      .mockReturnValueOnce([mockMachine, true, undefined])
      .mockReturnValueOnce([null, true, new Error('Failed to load')]);

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('Error loading machine config pool')).toBeInTheDocument();
  });

  it('should display message when machine config pool is not found', () => {
    useK8sWatchResourceMock
      .mockReturnValueOnce([mockMachine, true, undefined])
      .mockReturnValueOnce([[], true, undefined]);

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(
      screen.getByText('There is no MachineConfigPool associated with this node'),
    ).toBeInTheDocument();
  });

  it('should display machine config pool details when loaded', () => {
    useK8sWatchResourceMock
      .mockReturnValueOnce([mockMachine, true, undefined])
      .mockReturnValueOnce([[mockMachineConfigPool], true, undefined]);

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('test-mcp')).toBeInTheDocument();
    expect(screen.getByText('MachineConfigs')).toBeInTheDocument();
  });

  it('should display paused alert when machine config pool is paused', () => {
    const pausedMCP = {
      ...mockMachineConfigPool,
      spec: {
        ...mockMachineConfigPool.spec,
        paused: true,
      },
    };

    useK8sWatchResourceMock
      .mockReturnValueOnce([mockMachine, true, undefined])
      .mockReturnValueOnce([[pausedMCP], true, undefined]);

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(screen.getByText('Workload paused alert')).toBeInTheDocument();
  });

  it('should not watch machine when node has no machine annotation', () => {
    getNodeMachineNameAndNamespaceMock.mockReturnValue([null, null]);
    useK8sWatchResourceMock.mockReturnValue([null, false, undefined]);

    renderWithProviders(<NodeMachine obj={mockNode} />);

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
  });
});
