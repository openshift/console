import * as React from 'react';
import { shallow } from 'enzyme';
import { referenceForModel } from '@console/internal/module/k8s';
import { ResourceLink } from '@console/internal/components/utils';
import { sampleKnativeConfigurations } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import ConfigurationsOverviewListItem from '../ConfigurationsOverviewListItem';
import { ConfigurationModel } from '../../../models';

describe('ConfigurationsOverviewListItem', () => {
  it('should list the Configuration', () => {
    const wrapper = shallow(
      <ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />,
    );
    expect(wrapper.type()).toBe('li');
  });

  it('should have ResourceLink with proper kind', () => {
    const wrapper = shallow(
      <ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />,
    );
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ResourceLink)
        .at(0)
        .props().kind,
    ).toEqual(referenceForModel(ConfigurationModel));
  });

  it('should display latestCreatedRevisionName and latestReadyRevisionName', () => {
    const wrapper = shallow(
      <ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />,
    );
    expect(
      wrapper.text().includes(sampleKnativeConfigurations.data[0].status.latestCreatedRevisionName),
    ).toBe(true);
    expect(
      wrapper.text().includes(sampleKnativeConfigurations.data[0].status.latestReadyRevisionName),
    ).toBe(true);
  });
});
