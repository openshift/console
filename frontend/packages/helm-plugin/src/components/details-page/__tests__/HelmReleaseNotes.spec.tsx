import { screen } from '@testing-library/react';
import { useUserPreference } from '@console/shared';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { mockHelmReleases } from '../../__tests__/helm-release-mock-data';
import HelmReleaseNotes from '../notes/HelmReleaseNotes';

jest.mock('@console/shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const mockUserPreference = useUserPreference as jest.Mock;

describe('HelmReleaseNotes', () => {
  it('should render the SyncMarkdownView component when notes are available', () => {
    mockUserPreference.mockReturnValue(['light', jest.fn(), true]);
    renderWithProviders(<HelmReleaseNotes customData={mockHelmReleases[0]} />);

    // Check if markdown content is rendered (SyncMarkdownView renders an iframe with proper accessibility)
    expect(screen.getByRole('document', { name: 'Markdown content viewer' })).toBeInTheDocument();
  });

  it('should render empty state when release notes are not given', () => {
    mockUserPreference.mockReturnValue(['light', jest.fn(), true]);
    renderWithProviders(<HelmReleaseNotes customData={mockHelmReleases[1]} />);

    // Check for empty state content
    expect(screen.getByText('No release notes available')).toBeTruthy();
    expect(screen.getByText('Release notes are not available for this Helm Chart.')).toBeTruthy();
  });
});
