import { render, screen } from '@testing-library/react';
import type { DisplayFilters } from '../../topology-types';
import { TopologyViewType } from '../../topology-types';
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

describe(FilterDropdown.displayName, () => {
  let dropdownFilter: DisplayFilters;
  let onChange: () => void;
  beforeEach(() => {
    dropdownFilter = [...DEFAULT_TOPOLOGY_FILTERS];
    onChange = jest.fn();
  });

  it('should exist', () => {
    render(
      <FilterDropdown
        filters={dropdownFilter}
        viewType={TopologyViewType.graph}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should have the correct number of filters for graph view', async () => {
    render(
      <FilterDropdown
        filters={dropdownFilter}
        viewType={TopologyViewType.graph}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );

    const expandLabel = await screen.findByText('Application groupings');
    const showLabel1 = await screen.findByText('Pod count');
    const showLabel2 = await screen.findByText('Labels');

    expect(expandLabel).toBeInTheDocument();
    expect(showLabel1).toBeInTheDocument();
    expect(showLabel2).toBeInTheDocument();

    const filterItems = screen.getAllByRole('menuitem');
    expect(filterItems).toHaveLength(3);
  });

  it('should have the correct number of filters for list view', async () => {
    render(
      <FilterDropdown
        filters={dropdownFilter}
        viewType={TopologyViewType.list}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );

    const expandLabel = await screen.findByText('Application groupings');
    expect(expandLabel).toBeInTheDocument();

    expect(screen.queryByText('Pod count')).not.toBeInTheDocument();
    expect(screen.queryByText('Labels')).not.toBeInTheDocument();

    const filterItems = screen.getAllByRole('menuitem');
    expect(filterItems).toHaveLength(1);
  });

  it('should hide unsupported filters', async () => {
    render(
      <FilterDropdown
        filters={dropdownFilter}
        viewType={TopologyViewType.graph}
        supportedFilters={[EXPAND_APPLICATION_GROUPS_FILTER_ID]}
        onChange={onChange}
        opened
      />,
    );
    const checkboxes = await screen.findAllByRole('checkbox');
    expect(checkboxes.length).toBe(1);
  });

  it('should contain the expand groups switch', async () => {
    render(
      <FilterDropdown
        filters={dropdownFilter}
        viewType={TopologyViewType.graph}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    const switches = await screen.findAllByRole('switch');
    expect(switches.length).toBeGreaterThanOrEqual(1);
  });

  it('should disable individual group expand when expand groups is false', async () => {
    getFilterById(EXPAND_GROUPS_FILTER_ID, dropdownFilter).value = false;

    render(
      <FilterDropdown
        filters={dropdownFilter}
        viewType={TopologyViewType.graph}
        supportedFilters={dropdownFilter.map((f) => f.id)}
        onChange={onChange}
        opened
      />,
    );
    const disabledCheckboxes = screen
      .queryAllByRole('checkbox', { hidden: true })
      .filter((el) => el.hasAttribute('disabled'));

    expect(disabledCheckboxes.length).toBeGreaterThan(0);
  });
});
