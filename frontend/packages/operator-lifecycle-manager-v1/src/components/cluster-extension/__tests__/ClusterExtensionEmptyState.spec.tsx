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

    expect(screen.getByText('No Operators found')).toBeInTheDocument();
    expect(screen.getByText('No Operators are available.')).toBeInTheDocument();
  });

  it('should link to the Next-Gen Operators catalog', () => {
    renderWithProviders(<ClusterExtensionEmptyState />);

    expect(screen.getByRole('link', { name: /Next-Gen Operators catalog/ })).toHaveAttribute(
      'href',
      '/catalog/all-namespaces?catalogType=operator-olmv1',
    );
  });

  // Without the ClusterCatalog CRD the Next-Gen catalog type is not registered, so the link would 404.
  it('should omit the catalog link when the ClusterCatalog API is unavailable', () => {
    mockUseFlag.mockReturnValue(false);

    renderWithProviders(<ClusterExtensionEmptyState />);

    expect(screen.getByText('No Operators are available.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
