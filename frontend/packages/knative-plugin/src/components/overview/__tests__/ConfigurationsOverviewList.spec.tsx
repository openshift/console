import * as React from 'react';
import { shallow } from 'enzyme';
import { sampleKnativeConfigurations } from '../../../topology/__tests__/topology-knative-test-data';
import ConfigurationsOverviewList from '../ConfigurationsOverviewList';
import ConfigurationsOverviewListItem from '../ConfigurationsOverviewListItem';

describe('ConfigurationsOverviewList', () => {
  it('should render error Message when configurations array is empty', () => {
    const wrapper = shallow(<ConfigurationsOverviewList configurations={[]} />);
    expect(wrapper.text().includes('No Configurations found for this resource.')).toBe(true);
  });

  it('should render ConfigurationsOverviewListItem', () => {
    const wrapper = shallow(
      <ConfigurationsOverviewList configurations={sampleKnativeConfigurations.data} />,
    );
    expect(wrapper.find(ConfigurationsOverviewListItem)).toHaveLength(1);
  });
});
