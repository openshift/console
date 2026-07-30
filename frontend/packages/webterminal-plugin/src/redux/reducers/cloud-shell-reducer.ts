import type { CloudShellActions, DetachedSession } from '../actions/cloud-shell-actions';
import { Actions } from '../actions/cloud-shell-actions';

type State = {
  isExpanded: boolean;
  isActive: boolean;
  command: string | null;
  detachedSessions: DetachedSession[];
};

export const MAX_DETACHED_SESSIONS = 5;

const initialState: State = {
  isExpanded: false,
  isActive: false,
  command: null,
  detachedSessions: [],
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
    case Actions.AddDetachedSession: {
      if (state.detachedSessions.some((s) => s.id === action.payload.id)) {
        return state;
      }
      if (state.detachedSessions.length >= MAX_DETACHED_SESSIONS) {
        return state;
      }
      return {
        ...state,
        detachedSessions: [...state.detachedSessions, action.payload],
      };
    }
    case Actions.RemoveDetachedSession:
      return {
        ...state,
        detachedSessions: state.detachedSessions.filter((s) => s.id !== action.payload.id),
      };
    case Actions.ClearDetachedSessions:
      return {
        ...state,
        detachedSessions: [],
      };
    default:
      return state;
  }
};
