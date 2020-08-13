import { HostNamesMap } from './types';

export const initialState = {
  showNodesListOnADV: false,
  nodeNamesForLVS: [],
  allNodeNamesOnADV: [],
  hostNamesMapForADV: {},
};

export type State = {
  showNodesListOnADV: boolean;
  nodeNamesForLVS: string[];
  allNodeNamesOnADV: string[];
  hostNamesMapForADV: HostNamesMap;
};

export type Action =
  | { type: 'setShowNodesListOnADV'; value: boolean }
  | { type: 'setNodeNamesForLVS'; value: string[] }
  | { type: 'setAllNodeNamesOnADV'; value: string[] }
  | { type: 'setHostNamesMapForADV'; value: HostNamesMap };

export const reducer = (state: State, action: Action) => {
  switch (action.type) {
    case 'setShowNodesListOnADV':
      return Object.assign({}, state, { showNodesListOnADV: action.value });
    case 'setNodeNamesForLVS':
      return Object.assign({}, state, { nodeNamesForLVS: action.value });
    case 'setAllNodeNamesOnADV':
      return Object.assign({}, state, { allNodeNamesOnADV: action.value });
    case 'setHostNamesMapForADV':
      return Object.assign({}, state, { hostNamesMapForADV: action.value });
    default:
      return initialState;
  }
};
