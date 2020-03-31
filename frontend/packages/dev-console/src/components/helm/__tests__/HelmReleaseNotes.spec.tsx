import * as React from 'react';
import { mount } from 'enzyme';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import HelmReleaseNotes from '../HelmReleaseNotes';
import { mockHelmReleases } from './helm-release-mock-data';

describe('HelmReleaseNotes', () => {
  it('should render the SyncMarkdownView component when notes are available', () => {
    const helmReleaseResources = mount(<HelmReleaseNotes customData={mockHelmReleases[0]} />);
    expect(helmReleaseResources.find(SyncMarkdownView).exists()).toBe(true);
  });
});
