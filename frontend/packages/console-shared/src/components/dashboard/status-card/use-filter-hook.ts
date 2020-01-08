import * as React from 'react';
import * as _ from 'lodash';
import { alertFilters, AlertFilters, FilterType } from './utils';

const selected = {
  [FilterType.Type]: Object.keys(alertFilters[FilterType.Type]),
  [FilterType.Severity]: Object.keys(alertFilters[FilterType.Severity]),
};

export const useFilters = (): Filter => {
  const [selectedFilters, setSelectedFilters] = React.useState<SelectedFilters>(selected);

  const resetFilters = React.useCallback(() => setSelectedFilters(selected), []);

  const toggleFilter = React.useCallback(
    (type: FilterType, key: string) => {
      const newFilters = _.cloneDeep(selectedFilters);
      if (type === FilterType.Severity) {
        if (selectedFilters[FilterType.Severity].includes(key)) {
          newFilters[FilterType.Severity] = newFilters[FilterType.Severity].filter(
            (f) => f !== key,
          );
          setSelectedFilters(newFilters);
        } else {
          newFilters[FilterType.Severity].push(key);
          setSelectedFilters(newFilters);
        }
      } else if (type === FilterType.Type) {
        if (selectedFilters[FilterType.Type].includes(key)) {
          newFilters[FilterType.Type] = newFilters[FilterType.Type].filter((f) => f !== key);
          setSelectedFilters(newFilters);
        } else {
          newFilters[FilterType.Type].push(key);
          setSelectedFilters(newFilters);
        }
      }
    },
    [selectedFilters],
  );

  return [alertFilters, selectedFilters, resetFilters, toggleFilter];
};

type Filter = [AlertFilters, SelectedFilters, () => void, ToggleFilter];

export type SelectedFilters = {
  [FilterType.Severity]: string[];
  [FilterType.Type]: string[];
};

export type ToggleFilter = (type: FilterType, key: string) => void;
