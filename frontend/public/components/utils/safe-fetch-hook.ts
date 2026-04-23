import { useEffect, useRef } from 'react';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';

export const useSafeFetch = () => {
  const controller = useRef<AbortController>();
  useEffect(() => {
    controller.current = new AbortController();
    return () => controller.current.abort();
  }, []);

  return (url) => coFetchJSON(url, 'get', { signal: controller.current.signal as AbortSignal });
};
