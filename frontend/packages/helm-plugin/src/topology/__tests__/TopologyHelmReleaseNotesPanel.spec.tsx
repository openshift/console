import { screen } from '@testing-library/react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import TopologyGroupResourcesPanel from '@console/topology/src/components/side-bar/TopologyGroupResourcesPanel';
import TopologyHelmReleaseNotesPanel from '../TopologyHelmReleaseNotesPanel';
import { mockManifest, mockReleaseNotes } from './mockData';

jest.mock('@console/shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const mockUserPreference = useUserPreference as jest.Mock;

describe('TopologyHelmReleaseResourcesPanel', () => {
  const manifestResources = mockManifest;

  it('should render the correct number of resource categories', () => {
    renderWithProviders(
      <TopologyGroupResourcesPanel
        manifestResources={manifestResources}
        releaseNamespace="mock-ns"
      />,
    );
    expect(screen.getByText('ConfigMaps')).toBeInTheDocument();
    expect(screen.getByText('Deployments')).toBeInTheDocument();
  });
});

describe('TopologyHelmReleaseNotesPanel', () => {
  const releaseNotes = mockReleaseNotes;

  it('should render markdown when release notes are given', () => {
    mockUserPreference.mockReturnValue(['light', jest.fn(), true]);
    renderWithProviders(<TopologyHelmReleaseNotesPanel releaseNotes={releaseNotes} />);
    // Check that the markdown iframe is rendered with the correct accessibility attributes
    expect(screen.getByRole('document', { name: 'Markdown content viewer' })).toBeInTheDocument();
  });

  it('should render empty state when release notes are not given', () => {
    mockUserPreference.mockReturnValue(['light', jest.fn(), true]);
    renderWithProviders(<TopologyHelmReleaseNotesPanel releaseNotes="" />);
    // Check for empty state text or message
    expect(screen.getByText(/no release notes available/i)).toBeInTheDocument();
  });
});
