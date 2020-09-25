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
      'Kind-B': 3,
      'Kind-A': 4,
      'Kind-D': 5,
      'Kind-E': 6,
      'Kind-F': 7,
      'Kind-C': 2,
      'Kind-G': 8,
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

  it('should have no badge when there are no filters', () => {
    const wrapper = mount(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find('.odc-kind-filter-dropdown__kind-count').exists()).toBeFalsy();
  });

  it('should have the correct badge count when there are filters', () => {
    dropdownFilter.push({
      type: TopologyDisplayFilterType.kind,
      id: 'Kind-A',
      label: 'Kind-A',
      priority: 1,
      value: true,
    });
    dropdownFilter.push({
      type: TopologyDisplayFilterType.kind,
      id: 'Kind-C',
      label: 'Kind-C',
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
    const badge = wrapper.find('.odc-kind-filter-dropdown__kind-count');
    expect(badge.exists()).toBeTruthy();
    expect(badge.first().text()).toEqual('2');
  });

  it('should select kinds when filtered', () => {
    getFilterById(SHOW_GROUPS_FILTER_ID, dropdownFilter).value = false;
    dropdownFilter.push({
      type: TopologyDisplayFilterType.kind,
      id: 'Kind-A',
      label: 'Kind-A',
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

  it('should show resource counts correctly', () => {
    const wrapper = mount(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );
    const selectOptions = wrapper.find(SelectOption);
    const firstType = selectOptions.at(0);
    const secondType = selectOptions.at(1);
    const thirdType = selectOptions.at(2);
    expect(firstType.find('.pf-c-check__label').text()).toContain('(4)');
    expect(secondType.find('.pf-c-check__label').text()).toContain('(3)');
    expect(thirdType.find('.pf-c-check__label').text()).toContain('(2)');
  });
});
