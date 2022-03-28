import * as React from 'react';
import { debounce } from 'lodash';
import { UseDebounceCallback, Cancelable } from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from './deep-compare-memoize';

export const useDebounceCallback = <T extends (...args: any[]) => any>({
  callback,
  timeout = 500,
  debounceParams = {
    leading: false,
    trailing: true,
  },
}: UseDebounceCallback<T>): ((...args) => any) & Cancelable => {
  const memDebounceParams = useDeepCompareMemoize(debounceParams);
  const callbackRef = React.useRef<T>();
  callbackRef.current = callback;

  return React.useMemo(() => {
    return debounce((...args) => callbackRef.current(...args), timeout, memDebounceParams);
  }, [memDebounceParams, timeout]);
};
