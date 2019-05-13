import * as React from 'react';

/**
 * You should pretty much always use this if you are setting React state asynchronously and your component could be unmounted.
 * (https://github.com/facebook/react/issues/14113)
 */
export const useSafetyFirst = <S extends {}>(initialState: S) => {
  const mounted = React.useRef(true);
  React.useEffect(() => () => mounted.current = false, []);

  const [value, setValue] = React.useState(initialState);
  const setValueSafe = (newValue) => {
    if (mounted.current) {
      return setValue(newValue);
    }
  };

  return [value, setValueSafe] as [S, React.Dispatch<React.SetStateAction<S>>];
};
