import { UsePrometheusPoll, PrometheusResponse } from '../../../api/prometheus-types';
import { useURLPoll } from '../../fetch/hooks/useURLPoll';
import {
  getPrometheusURL,
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
} from '../utils';

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
