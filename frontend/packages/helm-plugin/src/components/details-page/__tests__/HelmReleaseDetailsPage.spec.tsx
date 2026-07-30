import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import HelmReleaseDetailsPage from '../HelmReleaseDetailsPage';

describe('HelmReleaseDetailsPage', () => {
  it('should render the namespaced page content region', () => {
    renderWithProviders(<HelmReleaseDetailsPage />);
    expect(screen.getByRole('region', { name: 'Page content' })).toBeInTheDocument();
  });

  it('should render the loading state initially', () => {
    renderWithProviders(<HelmReleaseDetailsPage />);
    // Component shows loading state initially before HelmReleaseDetails loads
    expect(screen.getByTestId('loading-box')).toBeInTheDocument();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
});
