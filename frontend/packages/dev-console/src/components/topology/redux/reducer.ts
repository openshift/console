import { Map } from 'immutable';
import { merge } from 'lodash';
import { TopologyAction, Actions } from './action';
import { TOPOLOGGY_FILTERS_LOCAL_STORAGE_KEY, DEFAULT_TOPOLOGY_FILTERS } from './const';

export type State = Map<string, any>;

export const getDefaultTopologyFilters = () => {
  const filters = localStorage.getItem(TOPOLOGGY_FILTERS_LOCAL_STORAGE_KEY);
  if (filters) {
    return merge({}, DEFAULT_TOPOLOGY_FILTERS, JSON.parse(filters));
  }
  localStorage.setItem(
    TOPOLOGGY_FILTERS_LOCAL_STORAGE_KEY,
    JSON.stringify(DEFAULT_TOPOLOGY_FILTERS),
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
