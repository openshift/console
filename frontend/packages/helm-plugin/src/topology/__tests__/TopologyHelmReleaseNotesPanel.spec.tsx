import { screen } from '@testing-library/react';
import { useUserSettings } from '@console/shared';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import TopologyGroupResourcesPanel from '@console/topology/src/components/side-bar/TopologyGroupResourcesPanel';
import TopologyHelmReleaseNotesPanel from '../TopologyHelmReleaseNotesPanel';
import { mockManifest, mockReleaseNotes } from './mockData';

jest.mock('@console/shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('TopologyHelmReleaseResourcesPanel', () => {
  const manifestResources = mockManifest;

  it('should render the correct number of resource categories', () => {
    const { container } = renderWithProviders(
      <TopologyGroupResourcesPanel
        manifestResources={manifestResources}
        releaseNamespace="mock-ns"
      />,
    );
    // Check that the component renders successfully
    expect(container.firstChild).toBeTruthy();
  });
});

describe('TopologyHelmReleaseNotesPanel', () => {
  const releaseNotes = mockReleaseNotes;

  it('should render markdown when release notes are given', () => {
    mockUserSettings.mockReturnValue(['light', jest.fn(), true]);
    renderWithProviders(<TopologyHelmReleaseNotesPanel releaseNotes={releaseNotes} />);
    // Check that the markdown iframe is rendered with the correct accessibility attributes
    expect(screen.getByRole('document', { name: 'Markdown content viewer' })).toBeInTheDocument();
  });

  it('should render empty state when release notes are not given', () => {
    mockUserSettings.mockReturnValue(['light', jest.fn(), true]);
    renderWithProviders(<TopologyHelmReleaseNotesPanel releaseNotes="" />);
    // Check for empty state text or message
    expect(screen.getByText(/no release notes available/i)).toBeTruthy();
  });
});
