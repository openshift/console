/* eslint-disable react-hooks-js/exhaustive-deps */
import { useEffect, useState } from 'react';
import type { UseURLPoll } from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { useSafeFetch } from './safe-fetch-hook';

export const URL_POLL_DEFAULT_DELAY = 15000; // 15 seconds

interface PollRequest {
  url: string;
  options?: RequestInit;
}

interface PollState<R> {
  url: string;
  response?: R;
  error?: unknown;
  loading: boolean;
}

export const useRequestPoll = <R>(
  url: string,
  delay = URL_POLL_DEFAULT_DELAY,
  request?: PollRequest | (() => PollRequest),
  ...dependencies: unknown[]
): [R | undefined, unknown, boolean] => {
  const [state, setState] = useState<PollState<R>>({ url, loading: !!url });
  const safeFetch = useSafeFetch();

  useEffect(() => {
    let active = true;
    let pending = false;
    if (!url) {
      return undefined;
    }
    const controller = new AbortController();
    const tick = () => {
      if (pending) return;
      pending = true;
      const currentRequest = typeof request === 'function' ? request() : request;
      return safeFetch(currentRequest?.url || url, {
        ...currentRequest?.options,
        signal: controller.signal,
      })
        .then((response: R) => {
          if (active) setState({ url, response, error: null, loading: false });
        })
        .catch((error: Error) => {
          if (active && error.name !== 'AbortError') {
            setState({ url, response: null, error, loading: false });
            console.error(`Error polling URL: ${error}`);
          }
        })
        .finally(() => {
          pending = false;
        });
    };
    tick();
    const interval = delay ? setInterval(tick, delay) : undefined;
    return () => {
      active = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [url, delay, request, ...dependencies]);

  // Reset during a URL change so even disabling and re-enabling the same URL
  // cannot expose a response from the previous subscription.
  if (state.url !== url) {
    setState({ url, loading: !!url });
    return [undefined, undefined, !!url];
  }
  return [state.response, state.error, state.loading];
};

export const useURLPoll: UseURLPoll = <R>(
  url: string,
  delay?: number,
  ...dependencies: unknown[]
) => useRequestPoll<R>(url, delay, undefined, ...dependencies);
