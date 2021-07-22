import { useURLPoll } from '../utils/url-poll-hook';
import { getPrometheusURL } from './helpers';
import { DEFAULT_PROMETHEUS_SAMPLES, DEFAULT_PROMETHEUS_TIMESPAN, PrometheusResponse } from '.';
import { UsePrometheusPoll } from '@console/dynamic-plugin-sdk/src/api/internal';

export const usePrometheusPoll: UsePrometheusPoll = ({
  delay,
  endpoint,
  endTime,
  namespace,
  query,
  samples = DEFAULT_PROMETHEUS_SAMPLES,
  timeout,
  timespan = DEFAULT_PROMETHEUS_TIMESPAN,
}) => {
  const url = getPrometheusURL({ endpoint, endTime, namespace, query, samples, timeout, timespan });

  return useURLPoll<PrometheusResponse>(url, delay, query, timespan);
};
