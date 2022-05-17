import {
  UsePrometheusPolls,
  URLPollsDataMap,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import {
  DEFAULT_PROMETHEUS_SAMPLES,
  DEFAULT_PROMETHEUS_TIMESPAN,
} from '@console/internal/components/graphs';
import { getPrometheusURL } from '@console/internal/components/graphs/helpers';
import useURLPolls from './useURLPolls';

const usePrometheusPolls: UsePrometheusPolls = (prometheusPollItems) => {
  const map: URLPollsDataMap = prometheusPollItems?.reduce((acc, curr) => {
    const { delay, endpoint, endTime, namespace, query, samples, timeout, timespan } = curr;
    const url = getPrometheusURL({
      endpoint,
      endTime,
      namespace,
      query,
      samples: samples || DEFAULT_PROMETHEUS_SAMPLES,
      timeout,
      timespan: timespan || DEFAULT_PROMETHEUS_TIMESPAN,
    });
    acc[url] = { url, delay, dependencies: [query, timespan] };
    return acc;
  }, {});

  return useURLPolls(map);
};

export default usePrometheusPolls;
