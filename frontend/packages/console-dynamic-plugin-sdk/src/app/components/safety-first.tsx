import * as React from 'react';

/**
 * @deprecated - This hook is not related to console functionality.
 * Hook that ensures a safe asynchronnous setting of React state in case a given component could be unmounted.
 * (https://github.com/facebook/react/issues/14113)
 * @param initialState initial state value
 * @returns An array with a pair of state value and it's set function.
 */
export const useSafetyFirst = <S extends any>(
  initialState: S | (() => S),
): [S, React.Dispatch<React.SetStateAction<S>>] => {
  const mounted = React.useRef(true);
  React.useEffect(() => () => (mounted.current = false), []);

  const [value, setValue] = React.useState(initialState);
  const setValueSafe = React.useCallback((newValue: S) => {
    if (mounted.current) {
      setValue(newValue);
    }
  }, []);

  return [value, setValueSafe];
};
