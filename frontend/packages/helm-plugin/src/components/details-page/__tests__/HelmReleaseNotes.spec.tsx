import * as React from 'react';
import { mount } from 'enzyme';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { mockHelmReleases } from '../../__tests__/helm-release-mock-data';
import HelmReleaseNotes from '../notes/HelmReleaseNotes';
import HelmReleaseNotesEmptyState from '../notes/HelmReleaseNotesEmptyState';

describe('HelmReleaseNotes', () => {
  it('should render the SyncMarkdownView component when notes are available', () => {
    const helmReleaseResources = mount(<HelmReleaseNotes customData={mockHelmReleases[0]} />);
    expect(helmReleaseResources.find(SyncMarkdownView).exists()).toBe(true);
  });

  it('should render empty state when release notes are not given', () => {
    const component = mount(<HelmReleaseNotes customData={mockHelmReleases[1]} />);
    expect(component.find(HelmReleaseNotesEmptyState)).toHaveLength(1);
  });
});
