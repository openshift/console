import { useContext } from 'react';
import { FilterContext } from './FilterProvider';

const useAppliedDisplayFilters = (): { [filterKey: string]: boolean } =>
  useContext(FilterContext).appliedFilters;

export { useAppliedDisplayFilters };
