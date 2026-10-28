import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { FLAG_CLUSTER_CATALOG_API } from '../../../const';
import { ClusterExtensionEmptyState } from '../ClusterExtensionEmptyState';

const mockUseFlag = jest.fn();
jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: (flag: string) => mockUseFlag(flag),
}));

describe('ClusterExtensionEmptyState', () => {
  beforeEach(() => {
    mockUseFlag.mockImplementation((flag: string) => flag === FLAG_CLUSTER_CATALOG_API);
  });

  it('should render the same title as the Classic empty state', () => {
    renderWithProviders(<ClusterExtensionEmptyState />);

    expect(screen.getByRole('heading', { name: 'No Operators installed' })).toBeInTheDocument();
    expect(
      screen.getByText('This cluster does not have any Operators installed as cluster extensions.'),
    ).toBeInTheDocument();
  });

  it('should link to the Cluster extensions catalog', () => {
    renderWithProviders(<ClusterExtensionEmptyState />);

    expect(screen.getByRole('link', { name: /Cluster extensions catalog/ })).toHaveAttribute(
      'href',
      '/catalog/all-namespaces?catalogType=operator&operatorCatalog=%5B%22Cluster%20extensions%22%5D',
    );
  });

  // Cluster extensions require the ClusterCatalog API.
  it('should omit the catalog link when the ClusterCatalog API is unavailable', () => {
    mockUseFlag.mockReturnValue(false);

    renderWithProviders(<ClusterExtensionEmptyState />);

    expect(
      screen.getByText('This cluster does not have any Operators installed as cluster extensions.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'To install Operators as cluster extensions, enable Technology Preview and configure a ClusterCatalog. If you do not have permission to do this, contact your cluster administrator.',
      ),
    ).toBeInTheDocument();
  });
});
