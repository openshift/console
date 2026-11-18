import { useEffect, useRef } from 'react';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';

export const useSafeFetch = () => {
  const controller = useRef<AbortController>(undefined);
  useEffect(() => {
    controller.current = new AbortController();
    return () => controller.current.abort();
  }, []);

  return (url: string, options: RequestInit = {}) =>
    coFetchJSON(url, options.method || 'GET', {
      ...options,
      signal: options.signal || (controller.current.signal as AbortSignal),
    });
};
