import { useURLPoll } from '../utils/url-poll-hook';
import { getPrometheusURL, PrometheusEndpoint } from './helpers';
import { DEFAULT_PROMETHEUS_SAMPLES, DEFAULT_PROMETHEUS_TIMESPAN, PrometheusResponse } from '.';

export const usePrometheusPoll = ({
  delay,
  endpoint,
  endTime,
  namespace,
  query,
  samples = DEFAULT_PROMETHEUS_SAMPLES,
  timeout,
  timespan = DEFAULT_PROMETHEUS_TIMESPAN,
}: PrometheusPollProps) => {
  const url = getPrometheusURL({ endpoint, endTime, namespace, query, samples, timeout, timespan });

  return useURLPoll<PrometheusResponse>(url, delay, query, timespan);
};

type PrometheusPollProps = {
  delay?: number;
  endpoint: PrometheusEndpoint;
  endTime?: number;
  namespace?: string;
  query: string;
  samples?: number;
  timeout?: string;
  timespan?: number;
};
