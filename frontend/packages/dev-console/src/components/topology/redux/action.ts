import { action, ActionType } from 'typesafe-actions';
import { TopologyFilters } from '../filters/filter-utils';
import { TOPOLOGGY_FILTERS_LOCAL_STORAGE_KEY } from './const';

export enum Actions {
  topologyFilters = 'topologyFilters',
}

export const setTopologyFilters = (filters: TopologyFilters) => {
  localStorage.setItem(TOPOLOGGY_FILTERS_LOCAL_STORAGE_KEY, JSON.stringify(filters));
  return action(Actions.topologyFilters, { filters });
};

const actions = {
  setTopologyFilters,
};

export type TopologyAction = ActionType<typeof actions>;
