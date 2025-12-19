import type { SetStateAction, Dispatch } from 'react';
import { useEffect } from 'react';
import { deserializeData } from '../utils/user-settings';
import { useUserSettings } from './useUserSettings';

export const useUserSettingsCompatibility = <T>(
  key: string,
  storageKey: string,
  defaultValue?: T,
  sync: boolean = false,
): [T, Dispatch<SetStateAction<T>>, boolean] => {
  const [settings, setSettings, loaded] = useUserSettings<T>(
    key,
    localStorage.getItem(storageKey) !== null
      ? deserializeData(localStorage.getItem(storageKey))
      : defaultValue,
    sync,
  );

  useEffect(
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
