import { Map as ImmutableMap } from 'immutable';
import type { AdmissionWebhookWarning, CoreState } from '../../redux-types';
import type { CoreAction } from '../actions/core';
import { ActionType } from '../actions/core';

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
  state: CoreState = {
    user: {},
    userResource: null,
    admissionWebhookWarnings: ImmutableMap<string, AdmissionWebhookWarning>(),
  },
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
          groups: action.payload.groups,
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

    case ActionType.SetUserResource:
      return {
        ...state,
        userResource: action.payload.userResource,
      };

    case ActionType.SetAdmissionWebhookWarning:
      return {
        ...state,
        admissionWebhookWarnings: state.admissionWebhookWarnings.set(
          action.payload.id,
          action.payload.warning,
        ),
      };
    case ActionType.RemoveAdmissionWebhookWarning:
      return {
        ...state,
        admissionWebhookWarnings: state.admissionWebhookWarnings.remove(action.payload.id),
      };
    default:
      return state;
  }
};
