import { action, ActionType as Action } from 'typesafe-actions';
import { Dispatch } from 'react-redux';

import { coFetchJSON } from '../co-fetch';
import { k8sBasePath } from '../module/k8s/k8s';
import { isWatchActive, RESULTS_TYPE } from '../reducers/dashboards';
import { RootState } from '../redux';

export enum ActionType {
  StopWatch = 'stopWatch',
  UpdateResult = 'updateResult',
  ActivateWatch = 'activateWatch',
  UpdateWatchTimeout = 'updateWatchTimeout',
  UpdateWatchInFlight = 'updateWatchInFlight',
}

const REFRESH_TIMEOUT = 5000;

export const ALERTS_KEY = 'alerts';

export const stopWatch = (type: RESULTS_TYPE, key: string) => action(ActionType.StopWatch, { type, key });
export const updateResult = (type: RESULTS_TYPE, key: string, result) => action(ActionType.UpdateResult, { type, key, result });
export const activateWatch = (type: RESULTS_TYPE, key: string) => action(ActionType.ActivateWatch, { type, key });
export const updateWatchTimeout = (type: RESULTS_TYPE, key: string, timeout: NodeJS.Timer) => action(ActionType.UpdateWatchTimeout, { type, key, timeout});
export const updateWatchInFlight = (type: RESULTS_TYPE, key: string, inFlight: boolean) => action(ActionType.UpdateWatchInFlight, { type, key, inFlight });

const dashboardsActions = {
  stopWatch,
  updateResult,
  activateWatch,
  updateWatchTimeout,
  updateWatchInFlight,
};

const fetchPeriodically: FetchPeriodically = async(dispatch, type, key, url, getState, fetch) => {
  if (!isWatchActive(getState().dashboards, type, key)) {
    return;
  }
  let result;
  try {
    dispatch(updateWatchInFlight(type, key, true));
    result = await fetch(url);
  } catch (error) {
    result = error;
  } finally {
    dispatch(updateWatchInFlight(type, key, false));
    dispatch(updateResult(type, key, result));
    const timeout = setTimeout(() => fetchPeriodically(dispatch, type, key, url, getState, fetch), REFRESH_TIMEOUT);
    dispatch(updateWatchTimeout(type, key, timeout));
  }
};

export const watchPrometheusQuery: WatchPrometheusQueryAction = query => (dispatch, getState) => {
  const isActive = isWatchActive(getState().dashboards, RESULTS_TYPE.PROMETHEUS, query);
  dispatch(activateWatch(RESULTS_TYPE.PROMETHEUS, query));
  if (!isActive) {
    const prometheusBaseURL = window.SERVER_FLAGS.prometheusBaseURL;
    if (!prometheusBaseURL) {
      dispatch(updateResult(RESULTS_TYPE.PROMETHEUS, query, {}));
    } else {
      const url = `${prometheusBaseURL}/api/v1/query?query=${encodeURIComponent(query)}`;
      fetchPeriodically(dispatch, RESULTS_TYPE.PROMETHEUS, query, url, getState, coFetchJSON);
    }
  }
};

export const watchURL: WatchURLAction = (url, fetch = coFetchJSON) => (dispatch, getState) => {
  const isActive = isWatchActive(getState().dashboards, RESULTS_TYPE.URL, url);
  dispatch(activateWatch(RESULTS_TYPE.URL, url));
  if (!isActive) {
    const k8sURL = `${k8sBasePath}/${url}`;
    fetchPeriodically(dispatch, RESULTS_TYPE.URL, url, k8sURL, getState, fetch);
  }
};

export const watchAlerts: WatchAlertsAction = () => (dispatch, getState) => {
  const isActive = isWatchActive(getState().dashboards, RESULTS_TYPE.ALERTS, ALERTS_KEY);
  dispatch(activateWatch(RESULTS_TYPE.ALERTS, ALERTS_KEY));
  if (!isActive) {
    const alertManagerBaseURL = window.SERVER_FLAGS.alertManagerBaseURL;
    if (!alertManagerBaseURL) {
      dispatch(updateResult(RESULTS_TYPE.ALERTS, ALERTS_KEY, {}));
    } else {
      const alertManagerURL = `${alertManagerBaseURL}/api/v2/alerts?silenced=false&inhibited=false`;
      fetchPeriodically(dispatch, RESULTS_TYPE.ALERTS, ALERTS_KEY, alertManagerURL, getState, coFetchJSON);
    }
  }
};

export const stopWatchPrometheusQuery = (query: string) => stopWatch(RESULTS_TYPE.PROMETHEUS, query);
export const stopWatchURL = (url: string) => stopWatch(RESULTS_TYPE.URL, url);
export const stopWatchAlerts = () => stopWatch(RESULTS_TYPE.ALERTS, ALERTS_KEY);

type ThunkAction = (dispatch: Dispatch, getState: () => RootState) => void;

export type WatchURLAction = (url: string, fetch?: Fetch) => ThunkAction;
export type WatchPrometheusQueryAction = (query: string) => ThunkAction;
export type WatchAlertsAction = () => ThunkAction;
export type StopWatchURLAction = (url: string) => void;
export type StopWatchPrometheusAction = (query: string) => void;
export type StopWatchAlertsAction = () => void;

export type Fetch = (url: string) => Promise<any>;

type FetchPeriodically =
  (dispatch: Dispatch, type: RESULTS_TYPE, key: string, url: string, getState: () => RootState, fetch: Fetch) => void;

export type DashboardsAction = Action<typeof dashboardsActions>;
