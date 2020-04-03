import * as React from 'react';
import { shallow } from 'enzyme';
import { MultiListPage } from '@console/internal/components/factory';
import HelmReleaseResources from '../HelmReleaseResources';
import { mockHelmReleases } from './helm-release-mock-data';

describe('HelmReleaseResources', () => {
  const match = {
    params: { ns: 'default', name: 'nodejs-example' },
    isExact: true,
    path: '',
    url: '',
  };

  const helmReleaseResourcesProps: React.ComponentProps<typeof HelmReleaseResources> = {
    match,
    customData: mockHelmReleases[0],
  };

  const helmReleaseResources = shallow(<HelmReleaseResources {...helmReleaseResourcesProps} />);
  it('should render the MultiListPage component', () => {
    expect(helmReleaseResources.find(MultiListPage).exists()).toBe(true);
  });
});
