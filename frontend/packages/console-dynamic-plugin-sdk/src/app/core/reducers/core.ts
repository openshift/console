import { CoreState } from '../../redux-types';
import { ActionType, CoreAction } from '../actions/core';

/**
 * Reducer function for the core
 * @param state the reducer state
 * @param action provided associated action type alongwith payload
 * @param action.type type of the action
 * @param action.payload associated payload for the action
 * @see CoreAction
 * @returns The the updated state.
 */
export const coreReducer = (
  state: CoreState = { user: { } },
  action: CoreAction,
): CoreState => {
  switch (action.type) {
    case ActionType.BeginImpersonate:
      return {
        ...state,
        impersonate: {
          kind: action.payload.kind,
          name: action.payload.name,
          subprotocols: action.payload.subprotocols,
        },
      };

    case ActionType.EndImpersonate: {
      const stateKeys = Object.keys(state);
      return stateKeys.reduce((acc, key) => {
        if (key !== 'impersonate') {
          return {
            ...acc,
            [key]: state[key],
          };
        }
        return acc;
      }, {} as CoreState);
    }

    case ActionType.SetUser:
      return {
        ...state,
        user: action.payload.userInfo,
      };

    default:
      return state;
  }
};
