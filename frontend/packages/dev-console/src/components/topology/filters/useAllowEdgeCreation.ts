import { allowEdgeCreation } from './filter-utils';
import { useDisplayFilters } from './useDisplayFilters';

const useAllowEdgeCreation = (): boolean => {
  const filters = useDisplayFilters();
  return allowEdgeCreation(filters);
};

export { useAllowEdgeCreation };
