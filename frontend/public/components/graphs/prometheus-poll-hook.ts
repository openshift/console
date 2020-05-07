/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from 'react';

import { PrometheusResponse } from '@console/shared/src/types/monitoring';

import { usePoll, useSafeFetch } from '../utils';
import { getPrometheusURL, PrometheusEndpoint } from './helpers';

const DEFAULT_DELAY = 15000; // 15 seconds
const DEFAULT_SAMPLES = 60;
const DEFAULT_TIMESPAN = 60 * 60 * 1000; // 1 hour

export const usePrometheusPoll = ({
  delay = DEFAULT_DELAY,
  endpoint,
  endTime = undefined,
  namespace,
  query,
  samples = DEFAULT_SAMPLES,
  timeout,
  timespan = DEFAULT_TIMESPAN,
}: PrometheusPollProps) => {
  const url = getPrometheusURL({ endpoint, endTime, namespace, query, samples, timeout, timespan });
  const [error, setError] = useState();
  const [response, setResponse] = useState();
  const [loading, setLoading] = useState(true);
  const safeFetch = useSafeFetch();
  const tick = useCallback(() => {
    if (url) {
      safeFetch(url)
        .then((data) => {
          setResponse(data);
          setError(undefined);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setError(err);
            setLoading(false);
            // eslint-disable-next-line no-console
            console.error(`Error polling Prometheus: ${err}`);
          }
        });
    } else {
      setLoading(false);
    }
  }, [url]);

  usePoll(tick, delay, endTime, query, timespan);

  return [response, error, loading] as [PrometheusResponse, Error, boolean];
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
