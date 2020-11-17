import * as React from 'react';
import { useUserSettings } from './useUserSettings';

export const useUserSettingsCompatibility = <T>(
  key: string,
  storageKey: string,
  defaultValue?: T,
): [T | string, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const [settings, setSettings, loaded] = useUserSettings<T | string>(
    key,
    localStorage.getItem(storageKey) || defaultValue,
  );

  React.useEffect(
    () => () => {
      if (loaded) {
        localStorage.removeItem(storageKey);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loaded],
  );

  return [settings, setSettings, loaded];
};
