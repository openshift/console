import * as React from 'react';
import { Select, SelectGroup, SelectOption, SelectVariant } from '@patternfly/react-core';
import { TopologyDisplayFilterType, DisplayFilters } from '../topology-types';

type FilterDropdownProps = {
  filters: DisplayFilters;
  supportedFilters: string[];
  onChange: (filter: DisplayFilters) => void;
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({ filters, supportedFilters, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selected = filters.filter((f) => f.value).map((f) => f.id);

  const onToggle = (open: boolean): void => setIsOpen(open);
  const onSelect = (e: React.MouseEvent, key: string) => {
    const index = filters.findIndex((f) => f.id === key);
    const filter = { ...filters[index], value: (e.target as HTMLInputElement).checked };
    onChange([...filters.slice(0, index), filter, ...filters.slice(index + 1)]);
  };

  const ShowFiltersKeyValue = filters
    .filter((f) => f.type === TopologyDisplayFilterType.show && supportedFilters.includes(f.id))
    .sort((a, b) => a.priority - b.priority)
    .reduce((acc, f) => {
      acc[f.id] = f.label;
      return acc;
    }, {});
  const ExpandFiltersKeyValue = filters
    .filter((f) => f.type === TopologyDisplayFilterType.expand && supportedFilters.includes(f.id))
    .sort((a, b) => a.priority - b.priority)
    .reduce((acc, f) => {
      acc[f.id] = f.label;
      return acc;
    }, {});
  const options = [];
  if (Object.keys(ShowFiltersKeyValue).length) {
    options.push(
      <SelectGroup key="show" label="Show">
        {Object.keys(ShowFiltersKeyValue).map((key) => (
          <SelectOption key={key} value={key}>
            {ShowFiltersKeyValue[key]}
          </SelectOption>
        ))}
      </SelectGroup>,
    );
  }
  if (Object.keys(ExpandFiltersKeyValue).length) {
    options.push(
      <SelectGroup key="expand" label="Expand">
        {Object.keys(ExpandFiltersKeyValue).map((key) => (
          <SelectOption key={key} value={key}>
            {ExpandFiltersKeyValue[key]}
          </SelectOption>
        ))}
      </SelectGroup>,
    );
  }

  return (
    <Select
      className="odc-filter-dropdown__select"
      variant={SelectVariant.checkbox}
      onToggle={onToggle}
      selections={selected}
      isOpen={isOpen}
      onSelect={onSelect}
      placeholderText="Display Options"
      isGrouped
      isCheckboxSelectionBadgeHidden
    >
      {...options}
    </Select>
  );
};

export default FilterDropdown;
