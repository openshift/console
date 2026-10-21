import type { GraphModel } from '@patternfly/react-topology';
import type { ActionType } from 'typesafe-actions';
import { action } from 'typesafe-actions';
import type { RootState } from '@console/internal/redux';

export enum Actions {
  topologyFilters = 'topologyFilters',
  supportedTopologyFilters = 'supportedTopologyFilters',
  supportedTopologyKinds = 'supportedTopologyKinds',
  topologyGraphModel = 'topologyGraphModel',
}

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
  setSupportedTopologyFilters,
  setSupportedTopologyKinds,
  setTopologyGraphModel,
};

export type TopologyAction = ActionType<typeof actions>;
