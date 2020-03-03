import * as React from 'react';
import { shallow } from 'enzyme';
import { ResourceSummary, SectionHeading } from '@console/internal/components/utils';
import HelmReleaseOverview from '../HelmReleaseOverview';

const helmReleaseOverviewProps: React.ComponentProps<typeof HelmReleaseOverview> = {
  obj: {
    metadata: {
      name: 'secret-name',
      namespace: 'xyz',
      creationTimestamp: '2020-01-13T05:42:19Z',
      labels: {
        name: 'helm-mysql',
        owner: 'helm',
        status: 'deployed',
      },
    },
  },
};

describe('HelmReleaseOverview', () => {
  it('should render the Section Heading for the Overview page', () => {
    const helmReleaseOverview = shallow(<HelmReleaseOverview {...helmReleaseOverviewProps} />);
    expect(
      helmReleaseOverview
        .find(SectionHeading)
        .at(0)
        .props().text,
    ).toEqual('Helm Release Details');
  });
  it('should render the ResourceSummary component', () => {
    const helmReleaseOverview = shallow(<HelmReleaseOverview {...helmReleaseOverviewProps} />);
    expect(helmReleaseOverview.find(ResourceSummary).exists()).toBe(true);
  });
});
