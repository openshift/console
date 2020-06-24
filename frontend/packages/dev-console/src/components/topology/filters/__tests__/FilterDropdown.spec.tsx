import * as React from 'react';
import { shallow } from 'enzyme';
import { SelectOption } from '@patternfly/react-core';
import FilterDropdown from '../FilterDropdown';
import { DisplayFilters } from '../../topology-types';
import { DEFAULT_TOPOLOGY_FILTERS } from '../const';

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
    const wrapper = shallow(
      <FilterDropdown
        filters={dropdownFilter}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
      />,
    );
    expect(wrapper.find(SelectOption)).toHaveLength(Object.keys(DEFAULT_TOPOLOGY_FILTERS).length);
  });

  it('should hide unsupported filters', () => {
    const wrapper = shallow(
      <FilterDropdown
        filters={dropdownFilter}
        supportedFilters={[dropdownFilter[0].id]}
        onChange={onChange}
      />,
    );
    expect(wrapper.find(SelectOption)).toHaveLength(1);
  });
});
