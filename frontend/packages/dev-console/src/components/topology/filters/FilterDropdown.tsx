import * as React from 'react';
import { Select, SelectVariant, SelectOption, SelectGroup } from '@patternfly/react-core';
import { ShowFiltersKeyValue, ExpandFiltersKeyValue, DisplayFilters } from './filter-utils';

type FilterDropdownProps = {
  filters: DisplayFilters;
  onChange: (filter: DisplayFilters) => void;
};

const FilterDropdown: React.FC<FilterDropdownProps> = ({ filters, onChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const selected = Object.keys(filters).filter((key) => filters[key]);

  const onToggle = (open: boolean): void => setIsOpen(open);
  const onSelect = (e: React.MouseEvent, key: string) => {
    onChange({ ...filters, [key]: (e.target as HTMLInputElement).checked });
  };
  const showOptions = (
    <SelectGroup label="Show">
      {Object.keys(ShowFiltersKeyValue).map((key) => (
        <SelectOption key={key} value={key}>
          {ShowFiltersKeyValue[key]}
        </SelectOption>
      ))}
    </SelectGroup>
  );
  const expandOptions = (
    <SelectGroup label="Expand">
      {Object.keys(ExpandFiltersKeyValue).map((key) => (
        <SelectOption key={key} value={key}>
          {ExpandFiltersKeyValue[key]}
        </SelectOption>
      ))}
    </SelectGroup>
  );

  return (
    <Select
      className="odc-filter-dropdown__select"
      variant={SelectVariant.checkbox}
      onToggle={onToggle}
      selections={selected}
      isExpanded={isOpen}
      onSelect={onSelect}
      placeholderText="Display Options"
      isGrouped
    >
      {showOptions}
      {expandOptions}
    </Select>
  );
};

export default FilterDropdown;
