import { useMemo } from 'react';
import { PrometheusEndpoint } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { PrometheusPollProps } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useRequestPoll } from '../utils/url-poll-hook';
import { DEFAULT_PROMETHEUS_SAMPLES, DEFAULT_PROMETHEUS_TIMESPAN } from './consts';
import { getPrometheusURL } from './helpers';
import type { PrometheusResponse } from './types';

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
  const basePath = customDataSource?.basePath;
  const nativeDataSource = !customDataSource;
  const [pollURL, request] = useMemo(() => {
    const getURL = () =>
      getPrometheusURL(
        { endpoint, endTime, namespace, query, samples, timeout, timespan },
        basePath,
      );
    const url = getURL();
    // Keep the subscription stable across renders, but advance a live range on each poll.
    if (endpoint === PrometheusEndpoint.QUERY_RANGE && endTime === undefined) {
      return [url, () => ({ url: getURL() })] as const;
    }
    if (!nativeDataSource || endpoint !== PrometheusEndpoint.QUERY || url.length <= 2048)
      return [url, undefined] as const;
    const separator = url.indexOf('?');
    const params = new URLSearchParams(url.slice(separator + 1));
    const body = new URLSearchParams({ query: params.get('query') }).toString();
    params.delete('query');
    return [
      url,
      {
        url: `${url.slice(0, separator)}?${params.toString()}`,
        options: {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      },
    ] as const;
  }, [endpoint, endTime, namespace, query, samples, timeout, timespan, basePath, nativeDataSource]);

  return useRequestPoll<PrometheusResponse>(pollURL, delay, request);
};
