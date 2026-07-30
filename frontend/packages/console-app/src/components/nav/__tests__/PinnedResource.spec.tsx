import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import PinnedResource from '../PinnedResource';
import useConfirmNavUnpinModal from '../useConfirmNavUnpinModal';

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: jest.fn(),
}));

const mockConfirmUnpinModal = jest.fn();
jest.mock('../useConfirmNavUnpinModal', () => ({
  __esModule: true,
  default: jest.fn(() => mockConfirmUnpinModal),
}));

jest.mock('../NavItemResource', () => ({
  NavItemResource: ({ children }: { children: React.ReactNode }) => children,
}));

const mockK8sModel = {
  apiVersion: 'v1',
  apiGroup: '',
  namespaced: true,
  kind: 'ConfigMap',
  label: 'ConfigMap',
  labelPlural: 'ConfigMaps',
  labelPluralKey: 'public~ConfigMaps',
  plural: 'configmaps',
  abbr: 'CM',
};

describe('PinnedResource', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when model is not found', () => {
    (useK8sModel as jest.Mock).mockReturnValue([undefined, false]);

    renderWithProviders(
      <PinnedResource
        resourceRef="unknown~v1~Unknown"
        navResources={['unknown~v1~Unknown']}
        onChange={mockOnChange}
        idx={0}
      />,
    );

    expect(screen.queryByTestId('draggable-pinned-resource-item')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unpin' })).not.toBeInTheDocument();
  });

  it('should render pinned resource with label when model exists', () => {
    (useK8sModel as jest.Mock).mockReturnValue([mockK8sModel, false]);

    renderWithProviders(
      <PinnedResource
        resourceRef="core~v1~ConfigMap"
        navResources={['core~v1~ConfigMap']}
        onChange={mockOnChange}
        idx={0}
      />,
    );

    expect(screen.getByText(/ConfigMaps/)).toBeInTheDocument();
  });

  it('should render unpin button with accessible label', () => {
    (useK8sModel as jest.Mock).mockReturnValue([mockK8sModel, false]);

    renderWithProviders(
      <PinnedResource
        resourceRef="core~v1~ConfigMap"
        navResources={['core~v1~ConfigMap']}
        onChange={mockOnChange}
        idx={0}
      />,
    );

    expect(screen.getByRole('button', { name: 'Unpin' })).toBeVisible();
  });

  it('should call confirm unpin modal when remove button is clicked', async () => {
    const user = userEvent.setup();
    (useK8sModel as jest.Mock).mockReturnValue([mockK8sModel, false]);

    renderWithProviders(
      <PinnedResource
        resourceRef="core~v1~ConfigMap"
        navResources={['core~v1~ConfigMap']}
        onChange={mockOnChange}
        idx={0}
      />,
    );

    const unpinButton = screen.getByRole('button', { name: 'Unpin' });
    await user.click(unpinButton);

    expect(mockConfirmUnpinModal).toHaveBeenCalledWith('core~v1~ConfigMap');
  });

  it('should pass onChange and navResources to useConfirmNavUnpinModal', () => {
    (useK8sModel as jest.Mock).mockReturnValue([mockK8sModel, false]);
    const navResources = ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig'];

    renderWithProviders(
      <PinnedResource
        resourceRef="core~v1~ConfigMap"
        navResources={navResources}
        onChange={mockOnChange}
        idx={0}
      />,
    );

    expect(useConfirmNavUnpinModal).toHaveBeenCalledWith(navResources, mockOnChange);
  });
});
