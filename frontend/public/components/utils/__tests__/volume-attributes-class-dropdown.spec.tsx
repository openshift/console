import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import type { VolumeAttributesClassKind } from '../../../module/k8s';
import { VolumeAttributesClassDropdown } from '../volume-attributes-class-dropdown';

// Mock useFlag to enable VAC support
jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: () => true,
}));

const mockVACData: VolumeAttributesClassKind[] = [
  {
    apiVersion: 'storage.k8s.io/v1beta1',
    kind: 'VolumeAttributesClass',
    metadata: { name: 'vac-ebs-gp3', uid: '1', resourceVersion: '1' },
    driverName: 'ebs.csi.aws.com',
  },
  {
    apiVersion: 'storage.k8s.io/v1beta1',
    kind: 'VolumeAttributesClass',
    metadata: { name: 'vac-cinder', uid: '2', resourceVersion: '2' },
    driverName: 'cinder.csi.openstack.org',
  },
  {
    apiVersion: 'storage.k8s.io/v1beta1',
    kind: 'VolumeAttributesClass',
    metadata: { name: 'vac-ebs-io2', uid: '3', resourceVersion: '3' },
    driverName: 'ebs.csi.aws.com',
  },
];

// Mock useK8sWatchResource
jest.mock('../../../components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: () => [mockVACData, true, null],
}));

const openDropdown = async () => {
  const user = userEvent.setup();
  const toggle = await screen.findByTestId('volumeattributesclass-dropdown');
  await user.click(toggle);
};

describe('VolumeAttributesClassDropdown', () => {
  it('renders all VACs when no filter is provided', async () => {
    renderWithProviders(
      <VolumeAttributesClassDropdown
        onChange={jest.fn()}
        selectedKey=""
        id="vac-dropdown"
        dataTest="volumeattributesclass-dropdown"
      />,
    );

    await openDropdown();

    await waitFor(() => {
      expect(screen.getByText('vac-ebs-gp3')).toBeInTheDocument();
    });
    expect(screen.getByText('vac-cinder')).toBeInTheDocument();
    expect(screen.getByText('vac-ebs-io2')).toBeInTheDocument();
  });

  it('filters VACs by driverName when filter is provided', async () => {
    const driverFilter = (vac: { driverName?: string }) => vac.driverName === 'ebs.csi.aws.com';

    renderWithProviders(
      <VolumeAttributesClassDropdown
        onChange={jest.fn()}
        selectedKey=""
        id="vac-dropdown"
        dataTest="volumeattributesclass-dropdown"
        filter={driverFilter}
      />,
    );

    await openDropdown();

    await waitFor(() => {
      expect(screen.getByText('vac-ebs-gp3')).toBeInTheDocument();
    });
    expect(screen.getByText('vac-ebs-io2')).toBeInTheDocument();
    expect(screen.queryByText('vac-cinder')).not.toBeInTheDocument();
  });

  it('shows no VACs when filter matches none', async () => {
    const noMatchFilter = (vac: { driverName?: string }) => vac.driverName === 'nonexistent.driver';

    renderWithProviders(
      <VolumeAttributesClassDropdown
        onChange={jest.fn()}
        selectedKey=""
        id="vac-dropdown"
        dataTest="volumeattributesclass-dropdown"
        filter={noMatchFilter}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('VolumeAttributesClass')).toBeInTheDocument();
    });

    await openDropdown();

    // Dropdown should be open but with no VAC items
    expect(screen.queryByText('vac-ebs-gp3')).not.toBeInTheDocument();
    expect(screen.queryByText('vac-cinder')).not.toBeInTheDocument();
    expect(screen.queryByText('vac-ebs-io2')).not.toBeInTheDocument();
  });
});
