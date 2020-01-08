import * as React from 'react';
import { Select, SelectGroup, SelectOption, SelectVariant } from '@patternfly/react-core';
import { AlertFilters, FilterType } from './utils';
import { SelectedFilters, ToggleFilter } from './use-filter-hook';

const AlertFilter: React.FC<AlertFilterProps> = ({ filters, selectedFilters, toggleFilter }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const onSelect = React.useCallback(
    (e, key: string) => {
      if (Object.keys(filters[FilterType.Type]).includes(key)) {
        toggleFilter(FilterType.Type, key);
      } else {
        toggleFilter(FilterType.Severity, key);
      }
    },
    [filters, toggleFilter],
  );

  return (
    <Select
      variant={SelectVariant.checkbox}
      onToggle={setIsExpanded}
      isExpanded={isExpanded}
      onSelect={onSelect}
      placeholderText="Filter"
      selections={[...selectedFilters[FilterType.Type], ...selectedFilters[FilterType.Severity]]}
      isGrouped
    >
      <SelectGroup titleId={FilterType.Type} label={FilterType.Type}>
        {Object.keys(filters[FilterType.Type]).map((key) => (
          <SelectOption key={key} value={key}>
            {filters[FilterType.Type][key]}
          </SelectOption>
        ))}
      </SelectGroup>
      <SelectGroup titleId={FilterType.Severity} label={FilterType.Severity}>
        {Object.keys(filters[FilterType.Severity]).map((key) => (
          <SelectOption key={key} value={key}>
            {filters[FilterType.Severity][key]}
          </SelectOption>
        ))}
      </SelectGroup>
    </Select>
  );
};

export default AlertFilter;

type AlertFilterProps = {
  filters: AlertFilters;
  selectedFilters: SelectedFilters;
  toggleFilter: ToggleFilter;
};
