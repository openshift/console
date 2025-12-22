import type { SetStateAction, Dispatch } from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * @deprecated - This hook is not related to console functionality.
 * Hook that ensures a safe asynchronnous setting of the React state in case a given component could be unmounted.
 * (https://github.com/facebook/react/issues/14113)
 * @param initialState initial state value
 * @returns An array with a pair of state value and its set function.
 */
export const useSafetyFirst = <S extends any>(
  initialState: S | (() => S),
): [S, Dispatch<SetStateAction<S>>] => {
  const mounted = useRef(true);
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const [value, setValue] = useState(initialState);
  const setValueSafe = useCallback((newValue: S) => {
    if (mounted.current) {
      setValue(newValue);
    }
  }, []);

  return [value, setValueSafe];
};
