/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from 'react';
import { usePoll } from './poll-hook';
import { useSafeFetch } from './safe-fetch-hook';

export const URL_POLL_DEFAULT_DELAY = 15000; // 15 seconds

export const useURLPoll = <R>(
  url: string,
  delay = URL_POLL_DEFAULT_DELAY,
  ...dependencies: any[]
): URLPoll<R> => {
  const [error, setError] = useState();
  const [response, setResponse] = useState<R>();
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
            console.error(`Error polling URL: ${err}`);
          }
        });
    } else {
      setLoading(false);
    }
  }, [url]);

  usePoll(tick, delay, ...dependencies);

  return [response, error, loading];
};

export type URLPoll<R> = [R, any, boolean];
