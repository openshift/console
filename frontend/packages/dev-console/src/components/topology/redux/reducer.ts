import { Map } from 'immutable';
import { TopologyAction, Actions, getAppliedFilters } from './action';
import { TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY } from './const';
import { DEFAULT_TOPOLOGY_FILTERS } from '../filters/const';

export type State = Map<string, any>;

export const getDefaultAppliedFilters = () => {
  const appliedFilters = localStorage.getItem(TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY);

  let defaultAppliedFilters;
  if (appliedFilters) {
    defaultAppliedFilters = JSON.parse(appliedFilters);
  } else {
    defaultAppliedFilters = getAppliedFilters(DEFAULT_TOPOLOGY_FILTERS);
    localStorage.setItem(
      TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY,
      JSON.stringify(defaultAppliedFilters),
    );
  }
  return defaultAppliedFilters;
};

export const getDefaultTopologyFilters = () => {
  const defaultAppliedFilters = getDefaultAppliedFilters();

  const filters = [...DEFAULT_TOPOLOGY_FILTERS];
  filters.forEach((filter) => {
    if (defaultAppliedFilters[filter.id] !== undefined) {
      filter.value = defaultAppliedFilters[filter.id];
    }
  });

  return filters;
};

export default (state: State, action: TopologyAction) => {
  if (!state) {
    return Map({
      filters: getDefaultTopologyFilters(),
      appliedFilters: getDefaultAppliedFilters(),
      supportedFilters: DEFAULT_TOPOLOGY_FILTERS.map((f) => f.id),
      supportedKinds: {},
    });
  }

  if (action.type === Actions.topologyFilters) {
    return state
      .set('filters', action.payload.filters)
      .set('appliedFilters', getAppliedFilters(action.payload.filters));
  }

  if (action.type === Actions.supportedTopologyFilters) {
    return state.set('supportedFilters', action.payload.supportedFilters);
  }

  if (action.type === Actions.supportedTopologyKinds) {
    return state.set('supportedKinds', action.payload.supportedKinds);
  }

  return state;
};
