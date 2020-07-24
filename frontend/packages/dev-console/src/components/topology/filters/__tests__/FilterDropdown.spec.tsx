import * as React from 'react';
import { mount, shallow } from 'enzyme';
import { SelectOption, Switch } from '@patternfly/react-core';
import FilterDropdown from '../FilterDropdown';
import { DisplayFilters } from '../../topology-types';
import { DEFAULT_TOPOLOGY_FILTERS, EXPAND_APPLICATION_GROUPS_FILTER_ID } from '../const';

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
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
      />,
    );
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have the correct number of filters', () => {
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(SelectOption)).toHaveLength(
      Object.keys(DEFAULT_TOPOLOGY_FILTERS).length - 1,
    );
  });

  it('should hide unsupported filters', () => {
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        supportedFilters={[EXPAND_APPLICATION_GROUPS_FILTER_ID]}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(SelectOption)).toHaveLength(1);
  });

  it('should contain the show expand groups switch', () => {
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(Switch)).toHaveLength(1);
  });
});
