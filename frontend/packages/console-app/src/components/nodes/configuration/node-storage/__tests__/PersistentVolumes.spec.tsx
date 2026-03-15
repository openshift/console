import { render, screen } from '@testing-library/react';
import { useAccessibleResources } from '@console/app/src/components/nodes/utils/useAccessibleResources';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { NodeKind } from '@console/internal/module/k8s';
import {
  getCurrentPod,
  getVMIPod,
  useWatchVirtualMachineInstances,
} from '../../../utils/NodeVmUtils';
import PersistentVolumes from '../PersistentVolumes';

jest.mock('react-redux', () => {
  const ActualReactRedux = jest.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});
jest.mock('../../../utils/NodeVmUtils', () => {
  const ActualNodeVmUtils = jest.requireActual('../../../utils/NodeVmUtils');
  return {
    ...ActualNodeVmUtils,
    getCurrentPod: jest.fn(),
    getVMIPod: jest.fn(),
    useWatchVirtualMachineInstances: jest.fn(),
  };
});

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: jest.fn(({ name }) => <span>{name}</span>),
}));

jest.mock('@console/internal/components/utils/headings', () => ({
  SectionHeading: jest.fn(({ text }) => <h2>{text}</h2>),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/shared/src', () => ({
  ...jest.requireActual('@console/shared/src'),
  DASH: '-',
  getUID: jest.fn((resource) => resource?.metadata?.uid),
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => <div>{children}</div>),
}));
jest.mock('@console/shared/src/hooks/flag', () => ({
  ...jest.requireActual('@console/shared/src/hooks/flag'),
  useFlag: jest.fn<boolean, []>(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/app/src/components/nodes/utils/useAccessibleResources', () => ({
  useAccessibleResources: jest.fn(),
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useAccessibleResourcesMock = useAccessibleResources as jest.Mock;
const useWatchVirtualMachineInstancesMock = useWatchVirtualMachineInstances as jest.Mock;
const getCurrentPodMock = getCurrentPod as jest.Mock;
const getVMIPodMock = getVMIPod as jest.Mock;
const useFlagMock = useFlag as jest.Mock;

describe('PersistentVolumes', () => {
  const mockNode: NodeKind = {
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name: 'test-node',
      uid: 'node-uid',
    },
    spec: {},
    status: {},
  };

  const mockPV = {
    apiVersion: 'v1',
    kind: 'PersistentVolume',
    metadata: {
      name: 'pv-1',
      uid: 'pv-uid-1',
      labels: {
        'kubernetes.io/hostname': 'test-node',
      },
    },
    spec: {
      capacity: {
        storage: '10Gi',
      },
      claimRef: {
        name: 'pvc-1',
        namespace: 'test-namespace',
      },
      storageClassName: 'standard',
    },
  };

  const mockPVC = {
    apiVersion: 'v1',
    kind: 'PersistentVolumeClaim',
    metadata: {
      name: 'pvc-1',
      namespace: 'test-namespace',
      uid: 'pvc-uid-1',
    },
    spec: {
      volumeName: 'pv-1',
    },
  };

  const mockPod = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'pod-1',
      namespace: 'test-namespace',
      uid: 'pod-uid-1',
    },
    spec: {
      nodeName: 'test-node',
      volumes: [
        {
          name: 'vol-1',
          persistentVolumeClaim: {
            claimName: 'pvc-1',
          },
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useWatchVirtualMachineInstancesMock.mockReturnValue([[], true, undefined]);
    useAccessibleResourcesMock.mockReturnValue([[], true, undefined]);
    // Default implementation: getCurrentPod returns the first pod from the array
    getCurrentPodMock.mockImplementation((pods) => pods?.[0]);
    // Default implementation: getVMIPod returns undefined
    getVMIPodMock.mockReturnValue(undefined);
  });

  it('should show loading skeleton when data is loading', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);

    const { container } = render(<PersistentVolumes node={mockNode} />);

    expect(container.querySelector('.loading-skeleton--table')).toBeInTheDocument();
  });

  it('should display error message when loading fails', () => {
    useK8sWatchResourceMock
      .mockReturnValueOnce([[], true, new Error('Failed to load')])
      .mockReturnValue([[], true, undefined]);

    render(<PersistentVolumes node={mockNode} />);

    expect(screen.getByText('Unable to load persistent volumes')).toBeInTheDocument();
  });

  it('should display message when no persistent volumes are found', () => {
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);

    render(<PersistentVolumes node={mockNode} />);

    expect(screen.getByText('No persistent volumes found')).toBeInTheDocument();
  });

  it('should display persistent volume information in a table', () => {
    useK8sWatchResourceMock
      .mockReturnValueOnce([[mockPV], true, undefined])
      .mockReturnValueOnce([[mockPVC], true, undefined]);
    useAccessibleResourcesMock
      .mockReturnValueOnce([[], true, undefined])
      .mockReturnValueOnce([[mockPod], true, undefined]);

    render(<PersistentVolumes node={mockNode} />);

    expect(screen.getByText('Mounted persistent volumes')).toBeInTheDocument();
    expect(screen.getByText('pv-1')).toBeInTheDocument();
    expect(screen.getByText('pvc-1')).toBeInTheDocument();
    expect(screen.getByText('pod-1')).toBeInTheDocument();
  });

  it('should display table headers', () => {
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);

    render(<PersistentVolumes node={mockNode} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('PVC')).toBeInTheDocument();
    expect(screen.getByText('Namespace')).toBeInTheDocument();
    expect(screen.getByText('Pod')).toBeInTheDocument();
    expect(screen.getByText('StorageClass')).toBeInTheDocument();
    expect(screen.getByText('Capacity')).toBeInTheDocument();
  });

  it('should filter persistent volumes by node hostname label', () => {
    const pvOtherNode = {
      ...mockPV,
      metadata: {
        ...mockPV.metadata,
        name: 'pv-other',
        labels: {
          'kubernetes.io/hostname': 'other-node',
        },
      },
    };

    useK8sWatchResourceMock
      .mockReturnValueOnce([[mockPV, pvOtherNode], true, undefined])
      .mockReturnValueOnce([[mockPVC], true, undefined]);
    useAccessibleResourcesMock
      .mockReturnValueOnce([[], true, undefined])
      .mockReturnValueOnce([[mockPod], true, undefined]);

    render(<PersistentVolumes node={mockNode} />);

    expect(screen.getByText('pv-1')).toBeInTheDocument();
    expect(screen.queryByText('pv-other')).not.toBeInTheDocument();
  });

  it('should display dash when no pod is found', () => {
    useK8sWatchResourceMock
      .mockReturnValueOnce([[mockPV], true, undefined])
      .mockReturnValueOnce([[mockPVC], true, undefined]);

    const { container } = render(<PersistentVolumes node={mockNode} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveTextContent('-');
  });

  it('should display "No persistent volumes found" when PVC is not found', () => {
    const pvNoClaim = {
      ...mockPV,
      spec: {
        ...mockPV.spec,
        claimRef: undefined,
      },
    };

    useK8sWatchResourceMock
      .mockReturnValueOnce([[pvNoClaim], true, undefined])
      .mockReturnValueOnce([[], true, undefined]);

    render(<PersistentVolumes node={mockNode} />);

    expect(screen.getByText('No persistent volumes found')).toBeInTheDocument();
  });

  it('should watch resources with correct field selector for pods', () => {
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);

    render(<PersistentVolumes node={mockNode} />);

    const podWatchCall = useAccessibleResourcesMock.mock.calls.find((call) =>
      call[0]?.fieldSelector?.includes('spec.nodeName'),
    );

    expect(podWatchCall[0].fieldSelector).toBe('spec.nodeName=test-node');
  });

  it('should handle VirtualMachine instances', () => {
    useFlagMock.mockReturnValue(true);
    useK8sWatchResourceMock.mockReset();
    useAccessibleResourcesMock.mockReset();
    const vmi = {
      metadata: {
        name: 'vm-1',
        namespace: 'test-namespace',
        uid: 'vmi-uid-1',
      },
    };

    const dataVolume = {
      metadata: {
        name: 'dv-1',
        namespace: 'test-namespace',
        ownerReferences: [
          {
            kind: 'VirtualMachine',
            name: 'vm-1',
          },
        ],
      },
    };

    const pvcWithDV = {
      ...mockPVC,
      metadata: {
        ...mockPVC.metadata,
        ownerReferences: [
          {
            kind: 'DataVolume',
            name: 'dv-1',
          },
        ],
      },
    };

    useWatchVirtualMachineInstancesMock.mockReturnValue([[vmi], true, undefined]);

    useK8sWatchResourceMock.mockImplementation((opts) =>
      opts?.groupVersionKind?.kind === 'PersistentVolume'
        ? [[mockPV], true, undefined]
        : [[pvcWithDV], true, undefined],
    );

    useAccessibleResourcesMock.mockImplementation((opts) =>
      opts?.groupVersionKind?.kind === 'DataVolume'
        ? [[dataVolume], true, undefined]
        : [[mockPod], true, undefined],
    );

    render(<PersistentVolumes node={mockNode} />);

    expect(screen.getByText('pv-1')).toBeInTheDocument();
  });
});
