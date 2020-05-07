import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { MonitoringAction, ActionType } from '../actions/monitoring';
import { MonitoringState, MonitoringRoutes } from '../redux-types';

const DEFAULTS = _.mapValues(MonitoringRoutes, undefined);

export const monitoringReducer = (
  state: MonitoringState,
  action: MonitoringAction,
): MonitoringState => {
  if (!state) {
    return ImmutableMap(DEFAULTS);
  }

  switch (action.type) {
    case ActionType.SetMonitoringURL:
      return state.merge({ [action.payload.name]: action.payload.url });

    default:
      return state;
  }
};
