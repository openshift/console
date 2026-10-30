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
  usePost,
}) => {
  const basePath = customDataSource?.basePath;
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
    // Fetch with GET unless the caller opted into POST for long queries: the monitoring
    // API's RBAC proxy maps POST to the "create" verb, which view-only users are not granted.
    if (
      usePost &&
      !customDataSource &&
      endpoint === PrometheusEndpoint.QUERY &&
      url.length > 2048
    ) {
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
    }
    return [url, undefined] as const;
  }, [
    endpoint,
    endTime,
    namespace,
    query,
    samples,
    timeout,
    timespan,
    basePath,
    customDataSource,
    usePost,
  ]);

  return useRequestPoll<PrometheusResponse>(pollURL, delay, request);
};
