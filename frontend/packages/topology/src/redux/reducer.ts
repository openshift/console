import { DEFAULT_TOPOLOGY_FILTERS } from '../filters/const';
import type { TopologyAction } from './action';
import { Actions } from './action';

type State = Record<string, any>;

export default (state: State, action: TopologyAction) => {
  if (!state) {
    return {
      supportedFilters: DEFAULT_TOPOLOGY_FILTERS.map((f) => f.id),
      supportedKinds: {},
    };
  }

  if (action.type === Actions.supportedTopologyFilters) {
    return { ...state, supportedFilters: action.payload.supportedFilters };
  }

  if (action.type === Actions.supportedTopologyKinds) {
    return { ...state, supportedKinds: action.payload.supportedKinds };
  }

  if (action.type === Actions.topologyGraphModel) {
    return {
      ...state,
      topologyGraphModel: {
        ...state.topologyGraphModel,
        [action.payload.namespace]: action.payload.graphModel,
      },
    };
  }

  return state;
};
