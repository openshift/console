import * as React from 'react';
import { deseralizeData, seralizeData } from '../utils/user-settings';

export const useUserSettingsLocalStorage = <T>(
  localStorageKey: string,
  userSettingsKey: string,
  defaultValue: T,
  sync: boolean = false,
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const keyRef = React.useRef(userSettingsKey);
  const defaultValueRef = React.useRef(defaultValue);
  const [lsData, setLsData] = React.useState(() => {
    const valueInLocalStorage =
      localStorage.getItem(localStorageKey) !== null &&
      deseralizeData(localStorage.getItem(localStorageKey));
    return valueInLocalStorage?.hasOwnProperty(keyRef.current) &&
      valueInLocalStorage[keyRef.current]
      ? valueInLocalStorage[keyRef.current]
      : defaultValueRef.current;
  });
  const lsDataRef = React.useRef<T>(lsData);
  lsDataRef.current = lsData;

  const localStorageUpdated = React.useCallback(
    (event: StorageEvent) => {
      if (event.key === localStorageKey) {
        const lsConfigMapData = deseralizeData(event.newValue);
        const newData = lsConfigMapData?.[keyRef.current];

        if (newData && seralizeData(newData) !== seralizeData(lsDataRef.current)) {
          setLsData(newData);
        }
      }
    },
    [localStorageKey],
  );

  React.useEffect(() => {
    if (sync) {
      window.addEventListener('storage', localStorageUpdated);
    }
    return () => {
      if (sync) {
        window.removeEventListener('storage', localStorageUpdated);
      }
    };
  }, [localStorageUpdated, sync]);

  const updateLsData = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action: React.SetStateAction<T>) => {
      const previousData = lsDataRef.current;
      const data =
        typeof action === 'function' ? (action as (prevState: T) => T)(previousData) : action;
      const lsConfigMapData = deseralizeData(localStorage.getItem(localStorageKey)) ?? {};
      if (
        data !== undefined &&
        seralizeData(data) !== seralizeData(lsConfigMapData?.[keyRef.current])
      ) {
        setLsData(data);
        const dataToUpdate = {
          ...lsConfigMapData,
          ...{
            [keyRef.current]: data,
          },
        };
        const newValue = seralizeData(dataToUpdate);

        // create a storage event to dispatch locally since browser windows do not fire the
        // storage event if the change originated from the current window
        const event = new StorageEvent('storage', {
          storageArea: localStorage,
          key: localStorageKey,
          newValue,
          oldValue: localStorage.getItem(localStorageKey),
          url: window.location.toString(),
        });

        // update local storage
        localStorage.setItem(localStorageKey, newValue);

        // dispatch local event
        window.dispatchEvent(event);
      }
    },
    [localStorageKey],
  );

  return [lsData, updateLsData];
};
