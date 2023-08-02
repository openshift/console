import * as React from 'react';
import { shallow } from 'enzyme';
import { MultiListPage } from '@console/internal/components/factory';
import { mockHelmReleases } from '../../../__tests__/helm-release-mock-data';
import HelmReleaseResources from '../HelmReleaseResources';

describe('HelmReleaseResources', () => {
  const helmReleaseResourcesProps: React.ComponentProps<typeof HelmReleaseResources> = {
    customData: mockHelmReleases[0],
  };

  const helmReleaseResources = shallow(<HelmReleaseResources {...helmReleaseResourcesProps} />);
  it('should render the MultiListPage component', () => {
    expect(helmReleaseResources.find(MultiListPage).exists()).toBe(true);
  });
});
