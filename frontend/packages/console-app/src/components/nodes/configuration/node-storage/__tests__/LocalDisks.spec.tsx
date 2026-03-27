import { render, screen } from '@testing-library/react';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import type { NodeKind } from '@console/internal/module/k8s';
import { useWatchBareMetalHost } from '../../../utils/NodeBareMetalUtils';
import LocalDisks from '../LocalDisks';

jest.mock('@console/internal/components/utils', () => ({
  SectionHeading: jest.fn(({ text }) => <h2>{text}</h2>),
}));

jest.mock('@console/shared/src', () => ({
  useDeepCompareMemoize: jest.fn((value) => value),
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => <div>{children}</div>),
}));

jest.mock('../../../utils/NodeBareMetalUtils', () => ({
  useWatchBareMetalHost: jest.fn(),
}));

const useWatchBareMetalHostMock = useWatchBareMetalHost as jest.Mock;

describe('LocalDisks', () => {
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

  const mockBareMetalHost: K8sResourceKind = {
    apiVersion: 'metal3.io/v1alpha1',
    kind: 'BareMetalHost',
    metadata: {
      name: 'test-host',
      namespace: 'openshift-machine-api',
    },
    status: {
      hardware: {
        storage: [
          {
            name: '/dev/sda',
            sizeBytes: 500000000000,
            rotational: false,
            model: 'Samsung SSD',
            serialNumber: 'SN123456',
            vendor: 'Samsung',
            hctl: '0:0:0:0',
          },
          {
            name: '/dev/sdb',
            sizeBytes: 1000000000000,
            rotational: true,
            model: 'WD HDD',
            serialNumber: 'SN789012',
            vendor: 'Western Digital',
            hctl: '0:0:1:0',
          },
        ],
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading skeleton when data is loading', () => {
    useWatchBareMetalHostMock.mockReturnValue([null, false, undefined]);

    const { container } = render(<LocalDisks node={mockNode} />);

    expect(container.querySelector('.loading-skeleton--table')).toBeInTheDocument();
  });

  it('should display error message when loading fails', () => {
    useWatchBareMetalHostMock.mockReturnValue([null, true, new Error('Failed to load')]);

    render(<LocalDisks node={mockNode} />);

    expect(screen.getByText('Unable to load local disks')).toBeInTheDocument();
  });

  it('should display message when no disks are found', () => {
    const emptyHost = {
      ...mockBareMetalHost,
      status: {
        hardware: {
          storage: [],
        },
      },
    };
    useWatchBareMetalHostMock.mockReturnValue([emptyHost, true, undefined]);

    render(<LocalDisks node={mockNode} />);

    expect(screen.getByText('No local disks found')).toBeInTheDocument();
  });

  it('should display disk information in a table', () => {
    useWatchBareMetalHostMock.mockReturnValue([mockBareMetalHost, true, undefined]);

    render(<LocalDisks node={mockNode} />);

    expect(screen.getByText('Local disks')).toBeInTheDocument();
    expect(screen.getByText('/dev/sda')).toBeInTheDocument();
    expect(screen.getByText('/dev/sdb')).toBeInTheDocument();
    expect(screen.getByText('Samsung SSD')).toBeInTheDocument();
    expect(screen.getByText('WD HDD')).toBeInTheDocument();
    expect(screen.getByText('SN123456')).toBeInTheDocument();
    expect(screen.getByText('SN789012')).toBeInTheDocument();
  });

  it('should display disk type correctly', () => {
    useWatchBareMetalHostMock.mockReturnValue([mockBareMetalHost, true, undefined]);

    render(<LocalDisks node={mockNode} />);

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('SSD');
    expect(rows[2]).toHaveTextContent('Rotational');
  });

  it('should display table headers', () => {
    useWatchBareMetalHostMock.mockReturnValue([mockBareMetalHost, true, undefined]);

    render(<LocalDisks node={mockNode} />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Serial number')).toBeInTheDocument();
    expect(screen.getByText('Vendor')).toBeInTheDocument();
    expect(screen.getByText('HCTL')).toBeInTheDocument();
  });

  it('should handle bare metal host without storage status', () => {
    const hostWithoutStorage = {
      ...mockBareMetalHost,
      status: {},
    };
    useWatchBareMetalHostMock.mockReturnValue([hostWithoutStorage, true, undefined]);

    render(<LocalDisks node={mockNode} />);

    expect(screen.getByText('No local disks found')).toBeInTheDocument();
  });

  it('should handle missing bare metal host', () => {
    useWatchBareMetalHostMock.mockReturnValue([null, true, undefined]);

    render(<LocalDisks node={mockNode} />);

    expect(screen.getByText('No local disks found')).toBeInTheDocument();
  });
});
