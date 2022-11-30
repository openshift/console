import * as React from 'react';
import { mount } from 'enzyme';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { useUserSettings } from '@console/shared';
import { mockHelmReleases } from '../../__tests__/helm-release-mock-data';
import HelmReleaseNotes from '../notes/HelmReleaseNotes';
import HelmReleaseNotesEmptyState from '../notes/HelmReleaseNotesEmptyState';

jest.mock('@openshift-console/plugin-shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('HelmReleaseNotes', () => {
  it('should render the SyncMarkdownView component when notes are available', () => {
    mockUserSettings.mockReturnValue(['light', jest.fn(), true]);
    const helmReleaseResources = mount(<HelmReleaseNotes customData={mockHelmReleases[0]} />);
    expect(helmReleaseResources.find(SyncMarkdownView).exists()).toBe(true);
  });

  it('should render empty state when release notes are not given', () => {
    mockUserSettings.mockReturnValue(['light', jest.fn(), true]);
    const component = mount(<HelmReleaseNotes customData={mockHelmReleases[1]} />);
    expect(component.find(HelmReleaseNotesEmptyState)).toHaveLength(1);
  });
});
