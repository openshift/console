import * as React from 'react';
import { Select, SelectGroup, SelectOption, SelectVariant, Switch } from '@patternfly/react-core';
import { TopologyDisplayFilterType, DisplayFilters } from '../topology-types';
import { EXPAND_GROUPS_FILTER_ID, SHOW_GROUPS_FILTER_ID } from './const';

import './FilterDropdown.scss';

type FilterDropdownProps = {
  filters: DisplayFilters;
  showGraphView: boolean;
  supportedFilters: string[];
  onChange: (filter: DisplayFilters) => void;
  opened?: boolean; // Use only for testing
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  filters,
  showGraphView,
  supportedFilters,
  onChange,
  opened = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(opened);
  const showGroups = filters?.find((f) => f.id === SHOW_GROUPS_FILTER_ID)?.value ?? true;
  const groupsExpanded = filters?.find((f) => f.id === EXPAND_GROUPS_FILTER_ID)?.value ?? true;

  const onToggle = (open: boolean): void => setIsOpen(open);
  const onSelect = (e: React.MouseEvent, key: string) => {
    const index = filters.findIndex((f) => f.id === key);
    const filter = { ...filters[index], value: (e.target as HTMLInputElement).checked };
    onChange([...filters.slice(0, index), filter, ...filters.slice(index + 1)]);
  };

  const onShowGroupsChange = (value: boolean) => {
    const index = filters?.findIndex((f) => f.id === SHOW_GROUPS_FILTER_ID) ?? -1;
    if (index === -1) {
      return;
    }
    const filter = {
      ...filters[index],
      value,
    };
    onChange([...filters.slice(0, index), filter, ...filters.slice(index + 1)]);
  };

  const onGroupsExpandedChange = (value: boolean) => {
    const index = filters?.findIndex((f) => f.id === EXPAND_GROUPS_FILTER_ID) ?? -1;
    if (index === -1) {
      return;
    }
    const filter = {
      ...filters[index],
      value,
    };
    onChange([...filters.slice(0, index), filter, ...filters.slice(index + 1)]);
  };

  const expandFilters = filters
    .filter(
      (f) =>
        f.type === TopologyDisplayFilterType.expand &&
        f.id !== EXPAND_GROUPS_FILTER_ID &&
        supportedFilters.includes(f.id),
    )
    .sort((a, b) => a.priority - b.priority);

  const showFilters = filters
    .filter((f) => f.type === TopologyDisplayFilterType.show && supportedFilters.includes(f.id))
    .sort((a, b) => a.priority - b.priority);

  const selectContent = (
    <div className="odc-topology-filter-dropdown">
      <div className="odc-topology-filter-dropdown__group">
        <span className="odc-topology-filter-dropdown__expand-groups-switcher">
          <span className="pf-c-select__menu-group-title">Show Groups</span>
          <Switch aria-label="Show Groups" isChecked={showGroups} onChange={onShowGroupsChange} />
        </span>
      </div>
      {expandFilters.length ? (
        <div className="odc-topology-filter-dropdown__group">
          <span className="odc-topology-filter-dropdown__expand-groups-switcher">
            <span className="pf-c-select__menu-group-title">Expand</span>
            <Switch
              aria-label="Collapse Groups"
              isChecked={groupsExpanded}
              onChange={onGroupsExpandedChange}
              isDisabled={!showGroups}
            />
          </span>
          <SelectGroup className="odc-topology-filter-dropdown__expand-groups-label">
            {expandFilters.map((filter) => (
              <SelectOption
                key={filter.id}
                value={filter.id}
                isDisabled={!groupsExpanded || !showGroups}
                isChecked={filter.value}
              >
                {filter.label}
              </SelectOption>
            ))}
          </SelectGroup>
        </div>
      ) : null}
      {showGraphView && showFilters.length ? (
        <div className="odc-topology-filter-dropdown__group">
          <SelectGroup label="Show">
            {showFilters.map((filter) => (
              <SelectOption key={filter.id} value={filter.id} isChecked={filter.value}>
                {filter.label}
              </SelectOption>
            ))}
          </SelectGroup>
        </div>
      ) : null}
    </div>
  );

  return (
    <Select
      className="odc-topology-filter-dropdown__select"
      variant={SelectVariant.checkbox}
      customContent={selectContent}
      onToggle={onToggle}
      isOpen={isOpen}
      onSelect={onSelect}
      placeholderText="Display Options"
      isGrouped
      isCheckboxSelectionBadgeHidden
    />
  );
};

export default FilterDropdown;
