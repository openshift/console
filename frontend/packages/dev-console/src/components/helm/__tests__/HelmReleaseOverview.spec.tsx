import * as React from 'react';
import { shallow } from 'enzyme';
import { ResourceSummary, SectionHeading } from '@console/internal/components/utils';
import HelmReleaseOverview from '../HelmReleaseOverview';
import { mockHelmReleases } from './helm-release-mock-data';
import HelmChartSummary from '../HelmChartSummary';

const helmReleaseOverviewProps: React.ComponentProps<typeof HelmReleaseOverview> = {
  obj: {
    metadata: {
      name: 'secret-name',
      namespace: 'xyz',
      creationTimestamp: '2020-01-13T05:42:19Z',
      labels: {
        name: 'ghost-test',
        owner: 'helm',
        status: 'deployed',
      },
    },
  },
  customData: mockHelmReleases[0],
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

  it('should render the HelmChartSummary component', () => {
    const helmReleaseOverview = shallow(<HelmReleaseOverview {...helmReleaseOverviewProps} />);
    expect(helmReleaseOverview.find(HelmChartSummary).exists()).toBe(true);
  });
});
