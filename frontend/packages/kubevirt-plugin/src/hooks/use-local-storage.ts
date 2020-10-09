import * as React from 'react';

export const useLocalStorage = (key: string): [string, React.Dispatch<string>] => {
  const [value, setValue] = React.useState(window.localStorage.getItem(key));
  const updateValue = React.useCallback(
    (val) => {
      window.localStorage.setItem(key, val);
      setValue(val);
    },
    [key],
  );
  return [value, updateValue];
};
