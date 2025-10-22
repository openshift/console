import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import HelmReleaseDetailsPage from '../HelmReleaseDetailsPage';

describe('HelmReleaseDetailsPage', () => {
  beforeEach(() => {
    renderWithProviders(<HelmReleaseDetailsPage />);
  });

  it('should render the NamespaceBar component', () => {
    // NamespacedPage renders a namespace bar with co-namespace-bar class
    expect(document.querySelector('.co-namespace-bar')).toBeTruthy();
  });

  it('should render the loading state initially', () => {
    // Component shows loading state initially before HelmReleaseDetails loads
    expect(screen.getByTestId('loading-box')).toBeTruthy();
    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });
});
