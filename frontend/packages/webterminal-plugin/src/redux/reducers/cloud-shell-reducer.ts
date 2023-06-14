import { CloudShellActions, Actions } from '../actions/cloud-shell-actions';

type State = {
  isExpanded: boolean;
  isActive: boolean;
  command: string | null;
};

const initialState: State = {
  isExpanded: false,
  isActive: false,
  command: null,
};

export default (state = initialState, action: CloudShellActions): State => {
  switch (action.type) {
    case Actions.SetCloudShellExpanded:
      return {
        ...state,
        isExpanded: action.payload.isExpanded,
      };
    case Actions.SetCloudShellActive:
      return {
        ...state,
        isActive: action.payload.isActive,
      };
    case Actions.SetCloudShellCommand: {
      const { isExpanded } = state;
      const {
        payload: { command },
      } = action;
      return {
        ...state,
        isExpanded: !!command || isExpanded,
        command,
      };
    }
    default:
      return state;
  }
};
