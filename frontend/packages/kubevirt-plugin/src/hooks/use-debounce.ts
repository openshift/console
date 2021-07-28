import * as React from 'react';
import { debounce } from 'lodash';
import { useDeepCompareMemoize } from './use-deep-compare-memoize';

interface Cancelable {
  cancel(): void;
  flush(): void;
}

export const useDebounceCallback = <T extends (...args: any[]) => any>(
  callback: T,
  timeout: number = 500,
  debounceParams: { leading?: boolean; trailing?: boolean; maxWait?: number } = {
    leading: false,
    trailing: true,
  },
): ((...args) => any) & Cancelable => {
  const memDebounceParams = useDeepCompareMemoize(debounceParams);
  const callbackRef = React.useRef<T>();
  callbackRef.current = callback;

  return React.useMemo(() => {
    return debounce((...args) => callbackRef.current(...args), timeout, memDebounceParams);
  }, [memDebounceParams, timeout]);
};
