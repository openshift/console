import { useCallback } from 'react';
import { debounce } from 'lodash';

export const useDebounceCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[],
  timeout: number = 500,
  debounceParams: { leading?: boolean; trailing?: boolean; maxWait?: number } = {
    leading: false,
    trailing: true,
  },
): T => useCallback(debounce(callback, timeout, debounceParams), dependencies);
