import * as React from 'react';
import { mount, shallow } from 'enzyme';
import { SelectOption } from '@patternfly/react-core';
import { DisplayFilters, TopologyDisplayFilterType } from '../../topology-types';
import { DEFAULT_TOPOLOGY_FILTERS, SHOW_GROUPS_FILTER_ID } from '../const';
import { getFilterById } from '../filter-utils';
import KindFilterDropdown from '../KindFilterDropdown';

describe(KindFilterDropdown.displayName, () => {
  let dropdownFilter: DisplayFilters;
  let onChange: () => void;
  let supportedKinds;
  beforeEach(() => {
    dropdownFilter = [...DEFAULT_TOPOLOGY_FILTERS];
    onChange = jasmine.createSpy();
    supportedKinds = {
      'apps~v1~Deployment': 1,
      'apps.openshift.io~v1~DeploymentConfig': 1,
      'apps~v1~DaemonSet': 1,
      'apps~v1~StatefulSet': 1,
      'batch~v1~Job': 1,
      'batch~v1beta1~CronJob': 1,
      'core~v1~Pod': 1,
    };
  });

  it('should exists', () => {
    const wrapper = shallow(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
      />,
    );
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have the correct number of filters', () => {
    const wrapper = mount(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(SelectOption)).toHaveLength(Object.keys(supportedKinds).length);
  });

  it('should kinds when filtered', () => {
    getFilterById(SHOW_GROUPS_FILTER_ID, dropdownFilter).value = false;
    const keys = Object.keys(supportedKinds);
    dropdownFilter.push({
      type: TopologyDisplayFilterType.kind,
      id: keys[0],
      label: keys[0],
      priority: 1,
      value: true,
    });
    const wrapper = mount(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );
    expect(
      wrapper
        .find(SelectOption)
        .first()
        .props().isChecked,
    ).toBeTruthy();
  });
});
