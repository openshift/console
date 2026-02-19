import type { SetStateAction, Dispatch } from 'react';
import { useEffect } from 'react';
import { deserializeData } from '../utils/user-settings';
import { useUserPreference } from './useUserPreference';

/** @deprecated Use {@link useUserPreference} hook. */
export const useUserPreferenceCompatibility = <T>(
  key: string,
  storageKey: string,
  defaultValue?: T,
  sync = false,
): [T, Dispatch<SetStateAction<T>>, boolean] => {
  const [preference, setPreference, loaded] = useUserPreference<T>(
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

  return [preference, setPreference, loaded];
};
