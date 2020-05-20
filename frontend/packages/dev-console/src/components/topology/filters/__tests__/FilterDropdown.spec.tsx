import * as React from 'react';
import { shallow } from 'enzyme';
import { SelectOption } from '@patternfly/react-core';
import FilterDropdown from '../FilterDropdown';
import { DisplayFilters } from '../filter-types';

const VALID_FILTERS = {
  podCount: true,
  eventSources: true,
  virtualMachines: true,
  showLabels: true,
  knativeServices: true,
  appGrouping: true,
  operatorGrouping: true,
  helmGrouping: true,
};

describe(FilterDropdown.displayName, () => {
  let dropdownFilter: DisplayFilters;
  let onChange: () => void;
  beforeEach(() => {
    dropdownFilter = { ...VALID_FILTERS };
    onChange = jasmine.createSpy();
  });

  it('should exists', () => {
    const wrapper = shallow(<FilterDropdown filters={dropdownFilter} onChange={onChange} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have 8 filters in total', () => {
    const wrapper = shallow(<FilterDropdown filters={dropdownFilter} onChange={onChange} />);
    expect(wrapper.find(SelectOption)).toHaveLength(Object.keys(VALID_FILTERS).length);
  });
});
