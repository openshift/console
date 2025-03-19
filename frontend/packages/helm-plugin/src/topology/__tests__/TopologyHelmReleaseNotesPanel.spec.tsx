import { shallow, mount } from 'enzyme';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { useUserSettings } from '@console/shared';
import TopologyGroupResourcesPanel from '@console/topology/src/components/side-bar/TopologyGroupResourcesPanel';
import HelmReleaseNotesEmptyState from '../../components/details-page/notes/HelmReleaseNotesEmptyState';
import TopologyHelmReleaseNotesPanel from '../TopologyHelmReleaseNotesPanel';
import { mockManifest, mockReleaseNotes } from './mockData';

jest.mock('@openshift-console/plugin-shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('TopologyHelmReleaseResourcesPanel', () => {
  const manifestResources = mockManifest;

  it('should render the correct number of resource categories', () => {
    const component = shallow(
      <TopologyGroupResourcesPanel
        manifestResources={manifestResources}
        releaseNamespace="mock-ns"
      />,
    );
    expect(component.find(SidebarSectionHeading)).toHaveLength(5);
  });
});

describe('TopologyHelmReleaseNotesPanel', () => {
  const releaseNotes = mockReleaseNotes;

  it('should render markdown when release notes are given', () => {
    mockUserSettings.mockReturnValue(['light', jest.fn(), true]);
    const component = mount(<TopologyHelmReleaseNotesPanel releaseNotes={releaseNotes} />);
    expect(component.find(SyncMarkdownView)).toHaveLength(1);
  });

  it('should render empty state when release notes are not given', () => {
    mockUserSettings.mockReturnValue(['light', jest.fn(), true]);
    const component = mount(<TopologyHelmReleaseNotesPanel releaseNotes="" />);
    expect(component.find(HelmReleaseNotesEmptyState)).toHaveLength(1);
  });
});
