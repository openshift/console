import { CoreState } from '../../redux-types';
import { ActionType, CoreAction } from '../actions/core';

/**
 * Reducer function for the core
 * @param state the reducer state
 * @param action provided associated action type alongwith payload
 * @param action.type type of the action
 * @param action.payload associated payload for the action
 * @see CoreAction
 * @return The the updated state.
 * * */
const coreReducer = (
  state: CoreState = {
    activeNamespace: '',
  },
  action: CoreAction,
): CoreState => {
  switch (action.type) {
    case ActionType.SetNamespace:
      if (!action.payload.namespace) {
        // eslint-disable-next-line no-console
        console.warn('setNamespace: Not setting to falsy!');
        return state;
      }
      return {
        ...state,
        activeNamespace: action.payload.namespace,
      };

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
        user: action.payload.user,
      };

    default:
      return state;
  }
};

export default coreReducer;
