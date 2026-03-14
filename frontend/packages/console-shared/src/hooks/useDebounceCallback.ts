import { useRef, useMemo } from 'react';
import type { DebounceSettings } from 'lodash';
import { debounce } from 'lodash';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';

interface Cancelable {
  cancel(): void;
  flush(): void;
}

export const useDebounceCallback = <T extends (...args: any[]) => any>(
  callback: T,
  timeout: number = 500,
  debounceParams: DebounceSettings = {
    leading: false,
    trailing: true,
  },
): ((...args) => any) & Cancelable => {
  const memDebounceParams = useDeepCompareMemoize(debounceParams);
  const callbackRef = useRef<T>();
  callbackRef.current = callback;

  return useMemo(() => {
    return debounce((...args) => callbackRef.current(...args), timeout, memDebounceParams);
  }, [memDebounceParams, timeout]);
};
