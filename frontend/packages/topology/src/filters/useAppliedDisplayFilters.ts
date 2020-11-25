import { useContext } from 'react';
import { FilterContext } from './FilterProvider';

const useAppliedDisplayFilters = (): { [filterKey: string]: boolean } => {
  return useContext(FilterContext).appliedFilters;
};

export { useAppliedDisplayFilters };
