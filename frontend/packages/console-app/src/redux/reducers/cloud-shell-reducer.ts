import { CloudShellActions, Actions } from '../actions/cloud-shell-actions';

type State = {
  isExpanded: boolean;
  isActive: boolean;
};

const initialState: State = {
  isExpanded: false,
  isActive: false,
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
    default:
      return state;
  }
};
