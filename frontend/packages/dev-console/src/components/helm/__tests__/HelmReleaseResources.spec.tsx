import * as React from 'react';
import { shallow } from 'enzyme';
import { MultiListPage } from '@console/internal/components/factory';
import HelmReleaseResources from '../HelmReleaseResources';

describe('HelmReleaseResources', () => {
  const helmReleaseResourcesProps: React.ComponentProps<typeof HelmReleaseResources> = {
    helmManifestResources: [
      {
        kind: 'Service',
        isNamespaced: true,
        namespace: 'test-helm',
        name: 'nodejs-example',
      },
    ],
  };
  const helmReleaseResources = shallow(<HelmReleaseResources {...helmReleaseResourcesProps} />);
  it('should render the MultiListPage component', () => {
    expect(helmReleaseResources.find(MultiListPage).exists()).toBe(true);
  });
});
