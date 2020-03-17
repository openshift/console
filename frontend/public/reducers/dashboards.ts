import { ActionType, DashboardsAction } from '../actions/dashboards';
import { Map as ImmutableMap, fromJS } from 'immutable';

export enum RESULTS_TYPE {
  PROMETHEUS = 'PROMETHEUS',
  URL = 'URL',
  ALERTS = 'ALERTS',
}

export const defaults = {
  [RESULTS_TYPE.PROMETHEUS]: fromJS({}),
  [RESULTS_TYPE.URL]: fromJS({}),
};

type Request<R> = {
  active: boolean;
  timeout: NodeJS.Timer;
  inFlight: boolean;
  data: R;
  error: any;
};

export type RequestMap<R> = ImmutableMap<string, Request<R>>;

export type DashboardsState = ImmutableMap<string, RequestMap<any>>;

export const isWatchActive = (state: DashboardsState, type: string, key: string): boolean =>
  state.getIn([type, key, 'active']) > 0 || state.getIn([type, key, 'inFlight']);

export const dashboardsReducer = (
  state: DashboardsState,
  action: DashboardsAction,
): DashboardsState => {
  if (!state) {
    return ImmutableMap(defaults);
  }
  switch (action.type) {
    case ActionType.ActivateWatch: {
      const activePath = [action.payload.type, action.payload.key, 'active'];
      const active = state.hasIn(activePath) ? state.getIn(activePath) : 0;
      return state.setIn(activePath, active + 1);
    }
    case ActionType.UpdateWatchTimeout:
      return state.setIn(
        [action.payload.type, action.payload.key, 'timeout'],
        action.payload.timeout,
      );
    case ActionType.UpdateWatchInFlight:
      return state.setIn(
        [action.payload.type, action.payload.key, 'inFlight'],
        action.payload.inFlight,
      );
    case ActionType.StopWatch: {
      const active = state.getIn([action.payload.type, action.payload.key, 'active']);
      const newState = state.setIn([action.payload.type, action.payload.key, 'active'], active - 1);
      if (active === 1) {
        clearTimeout(state.getIn([action.payload.type, action.payload.key, 'timeout']));
      }
      return newState;
    }
    case ActionType.SetError:
      return state.setIn(
        [action.payload.type, action.payload.key, 'loadError'],
        action.payload.error,
      );
    case ActionType.SetData:
      return state.withMutations((s) =>
        s
          .setIn([action.payload.type, action.payload.key, 'data'], action.payload.data)
          .setIn([action.payload.type, action.payload.key, 'loadError'], null),
      );
    default:
      return state;
  }
};
