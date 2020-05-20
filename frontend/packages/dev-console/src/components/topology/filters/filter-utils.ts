import { RootState } from '@console/internal/redux';
import { getQueryArgument } from '@console/internal/components/utils';
import { getDefaultTopologyFilters } from '../redux/reducer';
import { TOPOLOGY_SEARCH_FILTER_KEY, TopologyFilters } from './filter-types';

export const getTopologyFilters = (state: RootState): TopologyFilters => {
  const topology = state?.plugins?.devconsole?.topology;
  return topology ? topology.get('filters') : getDefaultTopologyFilters();
};

export const getTopologySearchQuery = () => getQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY) ?? '';
