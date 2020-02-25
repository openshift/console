import { action, ActionType as Action } from 'typesafe-actions';
import { Dispatch } from 'react-redux';

import { coFetchJSON } from '../co-fetch';
import { k8sBasePath } from '../module/k8s/k8s';
import { isWatchActive, RESULTS_TYPE, RequestMap } from '../reducers/dashboards';
import { RootState } from '../redux';
import { getPrometheusURL, PrometheusEndpoint } from '../components/graphs/helpers';
import { PrometheusResponse } from '../components/graphs';

export enum ActionType {
  StopWatch = 'stopWatch',
  SetData = 'setData',
  ActivateWatch = 'activateWatch',
  UpdateWatchTimeout = 'updateWatchTimeout',
  UpdateWatchInFlight = 'updateWatchInFlight',
  SetError = 'setError',
}

const REFRESH_TIMEOUT = 5000;

export const stopWatch = (type: RESULTS_TYPE, key: string) =>
  action(ActionType.StopWatch, { type, key });
export const setData = (type: RESULTS_TYPE, key: string, data) =>
  action(ActionType.SetData, { type, key, data });
export const activateWatch = (type: RESULTS_TYPE, key: string) =>
  action(ActionType.ActivateWatch, { type, key });
export const updateWatchTimeout = (type: RESULTS_TYPE, key: string, timeout: NodeJS.Timer) =>
  action(ActionType.UpdateWatchTimeout, { type, key, timeout });
export const updateWatchInFlight = (type: RESULTS_TYPE, key: string, inFlight: boolean) =>
  action(ActionType.UpdateWatchInFlight, { type, key, inFlight });
export const setError = (type: RESULTS_TYPE, key: string, error) =>
  action(ActionType.SetError, { type, key, error });

const dashboardsActions = {
  stopWatch,
  setData,
  activateWatch,
  updateWatchTimeout,
  updateWatchInFlight,
  setError,
};

export const getQueryKey = (query: string, timespan?: number): string =>
  timespan ? `${query}@${timespan}` : query;

export const getPrometheusQueryResponse = (
  prometheusResults: RequestMap<PrometheusResponse>,
  query: string,
  timespan?: number,
): [PrometheusResponse, any] => {
  const queryKey = getQueryKey(query, timespan);
  const data = prometheusResults.getIn([queryKey, 'data']);
  const loadError = prometheusResults.getIn([queryKey, 'loadError']);
  return [data, loadError];
};

const fetchPeriodically: FetchPeriodically = async (
  dispatch,
  type,
  key,
  getURL,
  getState,
  fetch,
) => {
  if (!isWatchActive(getState().dashboards, type, key)) {
    return;
  }
  try {
    dispatch(updateWatchInFlight(type, key, true));
    const data = await fetch(getURL());
    dispatch(setData(type, key, data));
  } catch (error) {
    dispatch(setError(type, key, error));
  } finally {
    dispatch(updateWatchInFlight(type, key, false));
    const timeout = setTimeout(
      () => fetchPeriodically(dispatch, type, key, getURL, getState, fetch),
      REFRESH_TIMEOUT,
    );
    dispatch(updateWatchTimeout(type, key, timeout));
  }
};

export const watchPrometheusQuery: WatchPrometheusQueryAction = (query, namespace, timespan) => (
  dispatch,
  getState,
) => {
  const queryKey = getQueryKey(query, timespan);
  const isActive = isWatchActive(getState().dashboards, RESULTS_TYPE.PROMETHEUS, queryKey);
  dispatch(activateWatch(RESULTS_TYPE.PROMETHEUS, queryKey));
  if (!isActive) {
    const prometheusBaseURL = namespace
      ? window.SERVER_FLAGS.prometheusTenancyBaseURL
      : window.SERVER_FLAGS.prometheusBaseURL;
    if (!prometheusBaseURL) {
      dispatch(
        setError(RESULTS_TYPE.PROMETHEUS, queryKey, new Error('Prometheus URL is not available')),
      );
    } else {
      const url = () =>
        getPrometheusURL({
          endpoint: timespan ? PrometheusEndpoint.QUERY_RANGE : PrometheusEndpoint.QUERY,
          namespace,
          query,
          timespan,
        });
      fetchPeriodically(dispatch, RESULTS_TYPE.PROMETHEUS, queryKey, url, getState, coFetchJSON);
    }
  }
};

export const watchURL: WatchURLAction = (url, fetch = coFetchJSON) => (dispatch, getState) => {
  const isActive = isWatchActive(getState().dashboards, RESULTS_TYPE.URL, url);
  dispatch(activateWatch(RESULTS_TYPE.URL, url));
  if (!isActive) {
    const k8sURL = () => `${k8sBasePath}/${url}`;
    fetchPeriodically(dispatch, RESULTS_TYPE.URL, url, k8sURL, getState, fetch);
  }
};

export const stopWatchPrometheusQuery: StopWatchPrometheusAction = (query, timespan) =>
  stopWatch(RESULTS_TYPE.PROMETHEUS, getQueryKey(query, timespan));
export const stopWatchURL = (url: string) => stopWatch(RESULTS_TYPE.URL, url);

type ThunkAction = (dispatch: Dispatch, getState: () => RootState) => void;

export type WatchURLAction = (url: string, fetch?: Fetch) => ThunkAction;
export type WatchPrometheusQueryAction = (
  query: string,
  namespace?: string,
  timespan?: number,
) => ThunkAction;
export type StopWatchURLAction = (url: string) => void;
export type StopWatchPrometheusAction = (query: string, timespan?: number) => void;

export type Fetch = (url: string) => Promise<any>;

type FetchPeriodically = (
  dispatch: Dispatch,
  type: RESULTS_TYPE,
  key: string,
  getURL: () => string,
  getState: () => RootState,
  fetch: Fetch,
) => void;

export type DashboardsAction = Action<typeof dashboardsActions>;
