import { useEffect, useRef } from 'react';
// AbortController is not supported in some older browser versions
import { AbortController } from 'abortcontroller-polyfill/dist/cjs-ponyfill';
import { coFetchJSON } from '../../co-fetch';

export const useSafeFetch = () => {
  const controller = useRef<AbortController>();
  useEffect(() => {
    controller.current = new AbortController();
    return () => controller.current.abort();
  }, []);

  return (url) => coFetchJSON(url, 'get', {signal: controller.current.signal as AbortSignal});
};
