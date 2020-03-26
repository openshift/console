import * as React from 'react';
import { shallow, mount } from 'enzyme';
import { SidebarSectionHeading, StatusBox } from '@console/internal/components/utils';
import { mockHelmReleaseNode, mockManifest, mockReleaseNotes } from './mockData';
import TopologyHelmReleaseResourcesPanel from '../TopologyHelmReleaseResourcesPanel';
import TopologyHelmReleaseNotesPanel from '../TopologyHelmReleaseNotesPanel';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { ConnectedTopologyHelmReleasePanel } from '../TopologyHelmReleasePanel';

describe('TopologyHelmReleasePanel', () => {
  it('should render the resources tab by default', () => {
    const component = mount(
      <ConnectedTopologyHelmReleasePanel helmRelease={mockHelmReleaseNode} />,
    );
    expect(component.find(TopologyHelmReleaseResourcesPanel)).toHaveLength(1);
  });

  it('should render the details tab when specified', () => {
    const component = mount(
      <ConnectedTopologyHelmReleasePanel
        helmRelease={mockHelmReleaseNode}
        selectedDetailsTab="Details"
      />,
    );
    // Status box displayed because there is no mock secret
    expect(component.find(StatusBox)).toHaveLength(1);
  });

  it('should render the release notes tab when specified', () => {
    const component = mount(
      <ConnectedTopologyHelmReleasePanel
        helmRelease={mockHelmReleaseNode}
        selectedDetailsTab="Release Notes"
      />,
    );
    // Status box displayed because there is no mock secret
    expect(component.find(TopologyHelmReleaseNotesPanel)).toHaveLength(1);
  });
});

describe('TopologyHelmReleaseResourcesPanel', () => {
  const manifestResources = mockManifest;

  it('should render the correct number of resource categories', () => {
    const component = shallow(
      <TopologyHelmReleaseResourcesPanel manifestResources={manifestResources} />,
    );
    expect(component.find(SidebarSectionHeading)).toHaveLength(5);
  });
});

describe('TopologyHelmReleaseNotesPanel', () => {
  const releaseNotes = mockReleaseNotes;

  it('should render markdown when release notes are given', () => {
    let component = mount(<TopologyHelmReleaseNotesPanel releaseNotes={releaseNotes} />);
    expect(component.find(SyncMarkdownView)).toHaveLength(1);

    component = mount(<TopologyHelmReleaseNotesPanel releaseNotes="" />);
    expect(component.find(SyncMarkdownView)).toHaveLength(0);
  });
});
