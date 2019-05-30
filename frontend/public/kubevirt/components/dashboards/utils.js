import { coFetchJSON } from '../../../co-fetch';

export const REFRESH_TIMEOUT = 5000;

export const getPrometheusBaseURL = () => window.SERVER_FLAGS.prometheusBaseURL;

export const getAlertManagerBaseURL = () => window.SERVER_FLAGS.alertManagerBaseURL;

export const getPrometheusMetrics = async() => {
  const url = `${getPrometheusBaseURL()}/api/v1/label/__name__/values`;
  return coFetchJSON(url);
};

export const getPrometheusQuery = async(query) => {
  const url = `${getPrometheusBaseURL()}/api/v1/query?query=${encodeURIComponent(query)}`;
  return coFetchJSON(url);
};

export const fetchPeriodically = async(url, onFetch, onTimeoutScheduled, responseHandler, fetchMethod = coFetchJSON) => {
  let response;
  try {
    response = await fetchMethod(url);
    if (responseHandler) {
      response = await responseHandler(response);
    }
  } catch (error) {
    response = error;
  } finally {
    if (onFetch(response)) {
      const timerId = setTimeout(() => fetchPeriodically(url, onFetch, onTimeoutScheduled, responseHandler, fetchMethod), REFRESH_TIMEOUT);

      if (onTimeoutScheduled) {
        onTimeoutScheduled(timerId);
      }
    }
  }
};

export const fetchPrometheusQuery = (query, onFetch, onTimeoutScheduled) => {
  const url = `${getPrometheusBaseURL()}/api/v1/query?query=${encodeURIComponent(query)}`;
  fetchPeriodically(url, onFetch, onTimeoutScheduled);
};

export const fetchAlerts = onFetch => {
  const url = `${getAlertManagerBaseURL()}/api/v2/alerts?silenced=false&inhibited=false`;
  fetchPeriodically(url, onFetch);
};

export const stopPrometheusQuery = id => {
  if (id) {
    clearTimeout(id);
  }
};
