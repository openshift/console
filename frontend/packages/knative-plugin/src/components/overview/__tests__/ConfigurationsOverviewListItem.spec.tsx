import * as React from 'react';
import { shallow } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { ConfigurationModel } from '../../../models';
import { sampleKnativeConfigurations } from '../../../topology/__tests__/topology-knative-test-data';
import ConfigurationsOverviewListItem from '../ConfigurationsOverviewListItem';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

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
