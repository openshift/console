import { Map } from 'immutable';
import { merge } from 'lodash';
import { TopologyAction, Actions } from './action';
import {
  TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY,
  DEFAULT_TOPOLOGY_FILTERS,
  TOPOLOGY_SEARCH_FILTER_KEY,
} from './const';

export type State = Map<string, any>;

export const getDefaultTopologyFilters = () => {
  const displayFilters = localStorage.getItem(TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY);
  const searchQuery = new URLSearchParams(window.location.search).get(TOPOLOGY_SEARCH_FILTER_KEY);

  if (displayFilters && searchQuery) {
    return merge({}, DEFAULT_TOPOLOGY_FILTERS, {
      display: JSON.parse(displayFilters),
      searchQuery,
    });
  }

  localStorage.setItem(
    TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY,
    JSON.stringify(DEFAULT_TOPOLOGY_FILTERS.display),
  );

  return DEFAULT_TOPOLOGY_FILTERS;
};

export default (state: State, action: TopologyAction) => {
  if (!state) {
    return Map({
      filters: getDefaultTopologyFilters(),
    });
  }

  if (action.type === Actions.topologyFilters) {
    return state.set('filters', action.payload.filters);
  }

  return state;
};
