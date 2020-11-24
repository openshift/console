import { GraphModel } from '@patternfly/react-topology';
import { RootState } from '@console/internal/redux';
import { action, ActionType } from 'typesafe-actions';
import { TOPOLOGY_DISPLAY_FILTERS_LOCAL_STORAGE_KEY } from './const';
import { DisplayFilters } from '../topology-types';

export enum Actions {
  topologyFilters = 'topologyFilters',
  supportedTopologyFilters = 'supportedTopologyFilters',
  supportedTopologyKinds = 'supportedTopologyKinds',
  topologyGraphModel = 'topologyGraphModel',
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

export const setTopologyGraphModel = (namespace: string, graphModel: GraphModel) => {
  return action(Actions.topologyGraphModel, { namespace, graphModel });
};

export const getTopologyGraphModel = (state: RootState, namespace: string): GraphModel => {
  const topology = state?.plugins?.devconsole?.topology;
  return topology?.get('topologyGraphModel')?.[namespace];
};

const actions = {
  setTopologyFilters,
  setSupportedTopologyFilters,
  setSupportedTopologyKinds,
  setTopologyGraphModel,
};

export type TopologyAction = ActionType<typeof actions>;
