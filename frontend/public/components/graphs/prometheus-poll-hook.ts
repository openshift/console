import { useURLPoll } from '../utils/url-poll-hook';
import { getPrometheusURL } from './helpers';
import { DEFAULT_PROMETHEUS_SAMPLES, DEFAULT_PROMETHEUS_TIMESPAN, PrometheusResponse } from '.';
import { PrometheusPollProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';

type UsePrometheusPoll = (props: PrometheusPollProps) => [PrometheusResponse, unknown, boolean];

export const usePrometheusPoll: UsePrometheusPoll = ({
  delay,
  endpoint,
  endTime,
  namespace,
  query,
  samples = DEFAULT_PROMETHEUS_SAMPLES,
  timeout,
  timespan = DEFAULT_PROMETHEUS_TIMESPAN,
  customDataSource,
}) => {
  const prometheusURLProps = { endpoint, endTime, namespace, query, samples, timeout, timespan };

  return useURLPoll<PrometheusResponse>(
    getPrometheusURL(prometheusURLProps, customDataSource?.basePath),
    delay,
    query,
    timespan,
  );
};
