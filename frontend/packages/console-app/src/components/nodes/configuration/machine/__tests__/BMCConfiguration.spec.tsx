import { screen } from '@testing-library/react';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import type { NodeKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  useIsBareMetalPluginActive,
  useWatchBareMetalHost,
} from '../../../utils/NodeBareMetalUtils';
import BMCConfiguration from '../BMCConfiguration';

jest.mock('@console/internal/components/utils', () => ({
  SectionHeading: jest.fn(({ text }) => <h2>{text}</h2>),
}));

jest.mock('../../../utils/NodeBareMetalUtils', () => {
  const actual = jest.requireActual('../../../utils/NodeBareMetalUtils');
  return {
    ...actual,
    useIsBareMetalPluginActive: jest.fn(),
    useWatchBareMetalHost: jest.fn(),
  };
});

const useIsBareMetalPluginActiveMock = useIsBareMetalPluginActive as jest.Mock;
const useWatchBareMetalHostMock = useWatchBareMetalHost as jest.Mock;

describe('BMCConfiguration', () => {
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
      uid: 'host-uid',
    },
    spec: {
      online: true,
      bmc: {
        address: 'redfish://192.168.1.10',
      },
      bootMACAddress: '52:54:00:ab:cd:ef',
    },
    status: {
      poweredOn: true,
      hardware: {
        nics: [{ ip: '10.0.0.1' }, { ip: '10.0.0.2' }],
        systemVendor: {
          manufacturer: 'VendorCo',
          productName: 'ServerOne',
        },
        firmware: {
          bmcVersion: '1.2.3',
        },
      },
      goodCredentials: {
        credentials: {
          name: 'bmc-secret',
          namespace: 'openshift-machine-api',
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing when the bare metal plugin is not active', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(false);
    useWatchBareMetalHostMock.mockReturnValue([null, false, undefined]);

    const { container } = renderWithProviders(<BMCConfiguration node={mockNode} />);

    expect(container.firstChild).toBeNull();
  });

  it('should call useWatchBareMetalHost with the node even when the plugin is inactive', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(false);
    useWatchBareMetalHostMock.mockReturnValue([null, false, undefined]);

    renderWithProviders(<BMCConfiguration node={mockNode} />);

    expect(useWatchBareMetalHostMock).toHaveBeenCalledWith(mockNode);
  });

  it('should show loading skeletons while BMC data is loading', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, false, undefined]);

    const { container } = renderWithProviders(<BMCConfiguration node={mockNode} />);

    expect(screen.getByRole('heading', { name: 'BMC Configuration' })).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton-detail-view').length).toBeGreaterThan(0);
  });

  it('should display an error alert when loading the bare metal host fails', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, true, new Error('Failed to load BMC')]);

    renderWithProviders(<BMCConfiguration node={mockNode} />);

    expect(screen.getByText('Unable to load BMC configuration')).toBeInTheDocument();
    expect(screen.getByText('Failed to load BMC')).toBeInTheDocument();
  });

  it('should display a message when no bare metal host is associated with the node', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, true, undefined]);

    renderWithProviders(<BMCConfiguration node={mockNode} />);

    expect(
      screen.getByText('There is no BMC configuration associated with this node'),
    ).toBeInTheDocument();
  });

  it('should render host BMC details when a bare metal host is loaded', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([mockBareMetalHost, true, undefined]);

    renderWithProviders(<BMCConfiguration node={mockNode} />);

    expect(screen.getByText('Host addresses')).toBeInTheDocument();
    expect(screen.getAllByText('redfish://192.168.1.10')).toHaveLength(2);
    expect(screen.getByText('10.0.0.1, 10.0.0.2')).toBeInTheDocument();
    expect(screen.getByText('52:54:00:ab:cd:ef')).toBeInTheDocument();

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('VendorCo ServerOne (Redfish)')).toBeInTheDocument();
    expect(screen.getByText('1.2.3')).toBeInTheDocument();
    expect(screen.getByText('On')).toBeInTheDocument();
    expect(screen.getByText('bmc-secret (namespace openshift-machine-api)')).toBeInTheDocument();
  });

  it('should show Detached power-related status when the host is detached', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    const detachedHost: K8sResourceKind = {
      ...mockBareMetalHost,
      status: {
        ...mockBareMetalHost.status,
        operationalStatus: 'detached',
      },
    };
    useWatchBareMetalHostMock.mockReturnValue([detachedHost, true, undefined]);

    renderWithProviders(<BMCConfiguration node={mockNode} />);

    expect(screen.getByText('Detached')).toBeInTheDocument();
  });
});
