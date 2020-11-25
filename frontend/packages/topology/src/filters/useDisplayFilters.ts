import { useContext } from 'react';
import { useDeepCompareMemoize } from '@console/shared';
import { DisplayFilters } from '../topology-types';
import { FilterContext } from './FilterProvider';

const useDisplayFilters = (): DisplayFilters => {
  const { filters } = useContext(FilterContext);
  return useDeepCompareMemoize(filters);
};

export { useDisplayFilters };
