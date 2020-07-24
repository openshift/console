import { RootState } from '@console/internal/redux';
import { getQueryArgument } from '@console/internal/components/utils';
import { getDefaultTopologyFilters } from '../redux/reducer';
import { getAppliedFilters } from '../redux/action';
import {
  TopologyDisplayOption,
  DisplayFilters,
  TopologyDisplayFilterType,
} from '../topology-types';
import { DEFAULT_TOPOLOGY_FILTERS, EXPAND_GROUPS_FILTER_ID } from './const';

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

export const isExpanded = (id: string, filters: DisplayFilters): boolean => {
  if (!filters) {
    return true;
  }
  const groupsExpanded = getFilterById(EXPAND_GROUPS_FILTER_ID, filters);
  if (!groupsExpanded.value) {
    return false;
  }
  const filter = getFilterById(id, filters);
  if (filter && filter.type === TopologyDisplayFilterType.expand) {
    return filter.value;
  }
  return true;
};

export const isShown = (id: string, filters: DisplayFilters): boolean => {
  if (!filters) {
    return true;
  }
  const filter = getFilterById(id, filters);
  if (filter && filter.type === TopologyDisplayFilterType.show) {
    return filter.value;
  }
  return true;
};
