import { action, ActionType } from 'typesafe-actions';
import { TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY } from './const';
import { DisplayFilters } from '../topology-types';

export enum Actions {
  topologyFilters = 'topologyFilters',
  supportedTopologyFilters = 'supportedTopologyFilters',
  supportedTopologyKinds = 'supportedTopologyKinds',
  supportedTopologyLabels = 'supportedTopologyLabels',
}

export const getAppliedFilters = (filters: DisplayFilters): { [id: string]: boolean } => {
  if (!filters?.length) {
    return {};
  }

  return filters.reduce((acc, filter) => {
    acc[filter.id] = filter.value;
    return acc;
  }, {});
};

export const setTopologyFilters = (filters: DisplayFilters) => {
  localStorage.setItem(
    TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY,
    JSON.stringify(getAppliedFilters(filters)),
  );
  return action(Actions.topologyFilters, { filters });
};

export const setSupportedTopologyFilters = (supportedFilters: string[]) => {
  return action(Actions.supportedTopologyFilters, { supportedFilters });
};

export const setSupportedTopologyKinds = (supportedKinds: { [key: string]: number }) => {
  return action(Actions.supportedTopologyKinds, { supportedKinds });
};

export const setSupportedTopologyLabels = (supportedLabels: string[]) => {
  return action(Actions.supportedTopologyLabels, { supportedLabels });
};

const actions = {
  setTopologyFilters,
  setSupportedTopologyFilters,
  setSupportedTopologyKinds,
  setSupportedTopologyLabels,
};

export type TopologyAction = ActionType<typeof actions>;
