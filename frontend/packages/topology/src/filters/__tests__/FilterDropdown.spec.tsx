import * as React from 'react';
import { Switch, SelectOption } from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import { DisplayFilters, TopologyDisplayFilterType, TopologyViewType } from '../../topology-types';
import {
  DEFAULT_TOPOLOGY_FILTERS,
  EXPAND_APPLICATION_GROUPS_FILTER_ID,
  EXPAND_GROUPS_FILTER_ID,
} from '../const';
import { getFilterById } from '../filter-utils';
import FilterDropdown from '../FilterDropdown';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

// FIXME Remove this code when jest is updated to at least 25.1.0 -- see https://github.com/jsdom/jsdom/issues/1555
if (!Element.prototype.closest) {
  Element.prototype.closest = function (this: Element, selector: string) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias, consistent-this
    let el: Element | null = this;
    while (el) {
      if (el.matches(selector)) return el;
      el = el.parentElement;
    }
    return null;
  };
}

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
        viewType={TopologyViewType.graph}
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
        viewType={TopologyViewType.graph}
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
        viewType={TopologyViewType.list}
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
        viewType={TopologyViewType.graph}
        supportedFilters={[EXPAND_APPLICATION_GROUPS_FILTER_ID]}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(SelectOption)).toHaveLength(1);
  });

  it('should contain the expand groups switch', () => {
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        viewType={TopologyViewType.graph}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find(Switch)).toHaveLength(1);
  });

  it('should disable individual group expand when expand groups is false', () => {
    getFilterById(EXPAND_GROUPS_FILTER_ID, dropdownFilter).value = false;
    const wrapper = mount(
      <FilterDropdown
        filters={dropdownFilter}
        viewType={TopologyViewType.graph}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    expect(wrapper.find('[disabled].pf-v6-c-menu-toggle')).toBeTruthy();
  });
});
