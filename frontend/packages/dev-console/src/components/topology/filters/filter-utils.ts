import { RootState } from '@console/internal/redux';
import { getQueryArgument } from '@console/internal/components/utils';
import { getDefaultTopologyFilters } from '../redux/reducer';
import { TopologyDisplayOption, DisplayFilters } from '../topology-types';
import { DEFAULT_TOPOLOGY_FILTERS } from './const';
import { getAppliedFilters } from '../redux/action';

export const TOPOLOGY_SEARCH_FILTER_KEY = 'searchQuery';

export const getTopologyFilters = (state: RootState): DisplayFilters => {
  const topology = state?.plugins?.devconsole?.topology;
  return topology ? topology.get('filters') : getDefaultTopologyFilters();
};

export const getSupportedTopologyFilters = (state: RootState): string[] => {
  const topology = state?.plugins?.devconsole?.topology;
  return topology ? topology.get('supportedFilters') : DEFAULT_TOPOLOGY_FILTERS.map((f) => f.id);
};

export const getAppliedTopologyFilters = (state: RootState): string[] => {
  const topology = state?.plugins?.devconsole?.topology;
  return topology ? topology.get('appliedFilters') : getAppliedFilters(DEFAULT_TOPOLOGY_FILTERS);
};

export const getTopologySearchQuery = () => getQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY) ?? '';

export const getFilterById = (id: string, filters: DisplayFilters): TopologyDisplayOption => {
  if (!filters) {
    return null;
  }
  return filters.find((f) => f.id === id);
};
