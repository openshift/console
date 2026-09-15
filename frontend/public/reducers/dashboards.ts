import type { RequestMap } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import type { DashboardsAction } from '../actions/dashboards';
import { ActionType } from '../actions/dashboards';
import { RESULTS_TYPE } from './dashboard-results';

export const defaults = {
  [RESULTS_TYPE.PROMETHEUS]: {},
  [RESULTS_TYPE.URL]: {},
};

export type DashboardsState = Record<string, RequestMap<any>>;

const setIn = (
  state: DashboardsState,
  type: string,
  key: string,
  prop: string,
  value: any,
): DashboardsState => ({
  ...state,
  [type]: {
    ...state[type],
    [key]: {
      ...state[type]?.[key],
      [prop]: value,
    },
  },
});

export const dashboardsReducer = (
  state: DashboardsState,
  action: DashboardsAction,
): DashboardsState => {
  if (!state) {
    return { ...defaults };
  }
  switch (action.type) {
    case ActionType.ActivateWatch: {
      const active = state[action.payload.type]?.[action.payload.key]?.active ?? 0;
      return setIn(state, action.payload.type, action.payload.key, 'active', active + 1);
    }
    case ActionType.UpdateWatchTimeout:
      return setIn(
        state,
        action.payload.type,
        action.payload.key,
        'timeout',
        action.payload.timeout,
      );
    case ActionType.UpdateWatchInFlight:
      return setIn(
        state,
        action.payload.type,
        action.payload.key,
        'inFlight',
        action.payload.inFlight,
      );
    case ActionType.StopWatch: {
      const active = state[action.payload.type]?.[action.payload.key]?.active;
      if (active === 1) {
        clearTimeout(state[action.payload.type]?.[action.payload.key]?.timeout);
      }
      return setIn(state, action.payload.type, action.payload.key, 'active', active - 1);
    }
    case ActionType.SetError:
      return setIn(
        state,
        action.payload.type,
        action.payload.key,
        'loadError',
        action.payload.error,
      );
    case ActionType.SetData: {
      const { type, key, data } = action.payload;
      return {
        ...state,
        [type]: {
          ...state[type],
          [key]: {
            ...state[type]?.[key],
            data,
            loadError: null,
          },
        },
      };
    }
    default:
      return state;
  }
};
