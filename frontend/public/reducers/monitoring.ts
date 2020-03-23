import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash-es';

import { MonitoringAction, ActionType } from '../actions/monitoring';

export const enum AlertSeverities {
  Critical = 'critical',
  Info = 'info',
  None = 'none',
  Warning = 'warning',
}

export const enum AlertStates {
  Firing = 'firing',
  Silenced = 'silenced',
  Pending = 'pending',
  NotFiring = 'not-firing',
}

export const enum SilenceStates {
  Active = 'active',
  Pending = 'pending',
  Expired = 'expired',
}

export enum MonitoringRoutes {
  Kibana = 'kibana',
}

const DEFAULTS = _.mapValues(MonitoringRoutes, undefined);

export type MonitoringState = ImmutableMap<string, any>;

export const monitoringReducerName = 'monitoringURLs';
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

const stateToProps = (desiredURLs: string[], state) => {
  const urls = desiredURLs.reduce(
    (previous, next) => ({ ...previous, [next]: state[monitoringReducerName].get(next) }),
    {},
  );
  return { urls };
};

export const connectToURLs = (...urls) => connect((state) => stateToProps(urls, state));

export const alertState = (a) => _.get(a, 'state', AlertStates.NotFiring);
export const silenceState = (s) => _.get(s, 'status.state');

// Sort alerts and silences by their state (sort first by the state itself, then by the timestamp relevant to the state)
export const alertStateOrder = (alert) => [
  [AlertStates.Firing, AlertStates.Silenced, AlertStates.Pending, AlertStates.NotFiring].indexOf(
    alertState(alert),
  ),
  alertState(alert) === AlertStates.Silenced
    ? _.max(_.map(alert.silencedBy, 'endsAt'))
    : _.get(alert, 'activeAt'),
];
export const silenceStateOrder = (silence) => [
  [SilenceStates.Active, SilenceStates.Pending, SilenceStates.Expired].indexOf(
    silenceState(silence),
  ),
  _.get(silence, silenceState(silence) === SilenceStates.Pending ? 'startsAt' : 'endsAt'),
];

// Determine if an Alert is silenced by a Silence (if all of the Silence's matchers match one of the Alert's labels)
export const isSilenced = (alert, silence) =>
  [AlertStates.Firing, AlertStates.Silenced].includes(alert.state) &&
  _.every(silence.matchers, (m) => {
    const alertValue = _.get(alert.labels, m.name);
    return (
      alertValue !== undefined &&
      (m.isRegex ? new RegExp(`^${m.value}$`).test(alertValue) : alertValue === m.value)
    );
  });
