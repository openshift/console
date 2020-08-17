import * as React from 'react';
import { mount, shallow } from 'enzyme';
import { SelectOption, Switch } from '@patternfly/react-core';
import FilterDropdown from '../FilterDropdown';
import { DisplayFilters, TopologyDisplayFilterType } from '../../topology-types';
import {
  DEFAULT_TOPOLOGY_FILTERS,
  EXPAND_APPLICATION_GROUPS_FILTER_ID,
  EXPAND_GROUPS_FILTER_ID,
  SHOW_GROUPS_FILTER_ID,
} from '../const';
import { getFilterById } from '../filter-utils';

describe(FilterDropdown.displayName, () => {
  let dropdownFilter: DisplayFilters;
  let onChange: () => void;
  beforeEach(() => {
    dropdownFilter = [...DEFAULT_TOPOLOGY_FILTERS];
    onChange = jasmine.createSpy();
  });

  it('should exists', () => {
    const wrapper = shallow(
      <FilterDropdown
        filters={dropdownFilter}
        showGraphView
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
      />,
    );
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have the correct number of filters for graph view', () => {
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        showGraphView
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(SelectOption)).toHaveLength(DEFAULT_TOPOLOGY_FILTERS.length - 1);
  });

  it('should hide the show filters for list view', () => {
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        showGraphView={false}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(SelectOption)).toHaveLength(
      DEFAULT_TOPOLOGY_FILTERS.filter((f) => f.type !== TopologyDisplayFilterType.show).length - 1,
    );
  });

  it('should hide unsupported filters', () => {
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        showGraphView
        supportedFilters={[EXPAND_APPLICATION_GROUPS_FILTER_ID]}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(SelectOption)).toHaveLength(1);
  });

  it('should contain the show groups and expand groups switches', () => {
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        showGraphView
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(Switch)).toHaveLength(2);
  });

  it('should disable individual group expand when expand groups is false', () => {
    getFilterById(EXPAND_GROUPS_FILTER_ID, dropdownFilter).value = false;
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        showGraphView
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    expect(
      wrapper
        .find(SelectOption)
        .first()
        .props().isDisabled,
    ).toBeTruthy();
  });

  it('should disable expand groups and individual group expands when show groups is false', () => {
    getFilterById(SHOW_GROUPS_FILTER_ID, dropdownFilter).value = false;
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        showGraphView
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    expect(
      wrapper
        .find(Switch)
        .at(1)
        .props().isDisabled,
    ).toBeTruthy();
    expect(
      wrapper
        .find(SelectOption)
        .first()
        .props().isDisabled,
    ).toBeTruthy();
  });
});
