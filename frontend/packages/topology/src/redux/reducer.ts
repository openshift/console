import { Map } from 'immutable';
import { DEFAULT_TOPOLOGY_FILTERS } from '../filters/const';
import { TopologyAction, Actions } from './action';

type State = Map<string, any>;

export default (state: State, action: TopologyAction) => {
  if (!state) {
    return Map({
      supportedFilters: DEFAULT_TOPOLOGY_FILTERS.map((f) => f.id),
      supportedKinds: {},
    });
  }

  if (action.type === Actions.supportedTopologyFilters) {
    return state.set('supportedFilters', action.payload.supportedFilters);
  }

  if (action.type === Actions.supportedTopologyKinds) {
    return state.set('supportedKinds', action.payload.supportedKinds);
  }

  if (action.type === Actions.topologyGraphModel) {
    const savedGraphModels = state.get('topologyGraphModel');
    const updatedGraphModels = {
      ...savedGraphModels,
      [action.payload.namespace]: action.payload.graphModel,
    };
    return state.set('topologyGraphModel', updatedGraphModels);
  }

  return state;
};
