/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useRef, useState } from 'react';
import { UseURLPoll } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { usePoll } from '@console/shared/src/hooks/usePoll';
import { useSafeFetch } from './safe-fetch-hook';
import { dedupedFetch } from './url-fetch-cache';

export const URL_POLL_DEFAULT_DELAY = 15000; // 15 seconds

export const useURLPoll: UseURLPoll = <R>(
  url: string,
  delay = URL_POLL_DEFAULT_DELAY,
  ...dependencies: any[]
) => {
  const [error, setError] = useState();
  const [response, setResponse] = useState<R>();
  const [loading, setLoading] = useState(true);
  const safeFetch = useSafeFetch();
  const jitterRef = useRef(delay ? Math.floor(Math.random() * delay * 0.2) : 0);
  const tick = useCallback(() => {
    if (url) {
      dedupedFetch(url, safeFetch)
        .then((data) => {
          setResponse(data);
          setError(null);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setResponse(null);
            setError(err);
            // eslint-disable-next-line no-console
            console.error(`Error polling URL: ${err}`);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [url]);

  usePoll(tick, delay + jitterRef.current, ...dependencies);

  return [response, error, loading];
};
