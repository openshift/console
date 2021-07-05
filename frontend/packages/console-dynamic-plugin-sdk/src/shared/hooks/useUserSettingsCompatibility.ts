import * as React from 'react';
import { deseralizeData } from '../utils/user-settings';
import { useUserSettings } from './useUserSettings';

export const useUserSettingsCompatibility = <T>(
  key: string,
  storageKey: string,
  defaultValue?: T,
  sync: boolean = false,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const [settings, setSettings, loaded] = useUserSettings<T>(
    key,
    localStorage.getItem(storageKey) !== null
      ? deseralizeData(localStorage.getItem(storageKey))
      : defaultValue,
    sync,
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
