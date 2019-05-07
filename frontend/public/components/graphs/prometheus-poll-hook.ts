/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback } from 'react';

import { usePoll, useSafeFetch } from '../utils';
import { getPrometheusURL, PrometheusEndpoint } from './helpers';

const DEFAULT_DELAY = 15000; // 15 seconds
const DEFAULT_SAMPLES = 60;
const DEFAULT_TIMESPAN = 60 * 60 * 1000; // 1 hour

export const usePrometheusPoll = ({
  delay = DEFAULT_DELAY,
  namespace,
  query,
  endpoint,
  samples = DEFAULT_SAMPLES,
  timeout,
  timespan = DEFAULT_TIMESPAN,
}: PrometheusPollProps) => {
  const url = getPrometheusURL({endpoint, namespace, query, samples, timeout, timespan});
  const [response, setResponse] = useState();
  const safeFetch = useSafeFetch();
  /* eslint-disable-next-line no-console */
  const tick = useCallback(() => safeFetch(url).then(setResponse).catch(err => console.error(`Error polling Prometheus: ${err}`)), [url]);

  usePoll(tick, delay);

  return response;
};

type PrometheusPollProps = {
  endpoint: PrometheusEndpoint;
  delay?: number;
  namespace?: string;
  query: string;
  samples?: number;
  timeout?: number;
  timespan?: number;
}
