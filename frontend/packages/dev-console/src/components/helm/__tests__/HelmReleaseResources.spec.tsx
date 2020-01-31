import * as React from 'react';
import { shallow } from 'enzyme';
import { MultiListPage } from '@console/internal/components/factory';
import HelmReleaseResources from '../HelmReleaseResources';

describe('HelmReleaseResources', () => {
  const helmReleaseResourcesProps: React.ComponentProps<typeof HelmReleaseResources> = {
    obj: {
      data: {
        release: 'SDRzSUFBQUFBQUFDLyt5OUNYT2pTTFl3K2xjVW1vbVk5K0xhTG',
        kind: 'Secret',
      },
      metadata: {
        creationTimestamp: '2020-01-20T05:37:13Z',
        name: 'sh.helm.release.v1.helm-mysql.v1',
        namespace: 'deb',
        labels: {
          name: 'helm-mysql',
        },
      },
    },
  };
  const helmReleaseResources = shallow(<HelmReleaseResources {...helmReleaseResourcesProps} />);
  it('should render the MultiListPage component', () => {
    expect(helmReleaseResources.find(MultiListPage).exists()).toBe(true);
  });
});
