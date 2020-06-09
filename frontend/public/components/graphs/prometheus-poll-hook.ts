import { useURLPoll } from '../utils/url-poll-hook';
import { getPrometheusURL, PrometheusEndpoint } from './helpers';
import { PrometheusResponse } from '.';

const DEFAULT_SAMPLES = 60;
const DEFAULT_TIMESPAN = 60 * 60 * 1000; // 1 hour

export const usePrometheusPoll = ({
  delay,
  endpoint,
  endTime = undefined,
  namespace,
  query,
  samples = DEFAULT_SAMPLES,
  timeout,
  timespan = DEFAULT_TIMESPAN,
}: PrometheusPollProps) => {
  const url = getPrometheusURL({ endpoint, endTime, namespace, query, samples, timeout, timespan });

  return useURLPoll<PrometheusResponse>(url, delay, endTime, query, timespan);
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
