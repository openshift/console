import type { SetStateAction, Dispatch } from 'react';
import { useRef, useEffect, useState, useCallback } from 'react';

// TODO(react18): Remove this hook - CONSOLE-5039
/**
 * @deprecated Directly use {@link useState} (and be happy)
 *
 * This hook originally was created to suppress this React warning:
 *
 * > Warning: Can't perform a React state update on an unmounted component. This
 * > is a no-op, but it indicates a memory leak in your application. To fix, cancel
 * > all subscriptions and asynchronous tasks in a useEffect cleanup function.
 *
 * This warning was meant to warn developers about potential memory leaks when
 * subscribing to an external data source, and then forgetting to unsubscribe when
 * the component unmounts.
 *
 * In React 18, this warning was removed as it was determined to be misleading,
 * because in many cases, there is no memory leak, so the warning served to
 * confuse developers.
 *
 * @see https://github.com/reactwg/react-18/discussions/82
 *
 * ---
 *
 * Previously, this hook originally had this description:
 * > Hook that ensures a safe asynchronous setting of the React state in case a
 * > given component could be unmounted.
 *
 * @see https://github.com/facebook/react/issues/14113
 *
 * @param initialState initial state value
 *
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
