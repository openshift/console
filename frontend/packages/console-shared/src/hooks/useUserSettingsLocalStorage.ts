import * as React from 'react';
import { deseralizeData, seralizeData } from '../utils/user-settings';

export const useUserSettingsLocalStorage = <T>(
  storageKey: string,
  userSettingsKey: string,
  defaultValue: T,
  sync = false,
  session = false, // use sessionStorage if set to `true`
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const storage = session ? sessionStorage : localStorage;
  const keyRef = React.useRef(userSettingsKey);
  const defaultValueRef = React.useRef(defaultValue);
  const [data, setData] = React.useState(() => {
    const valueInStorage =
      storage.getItem(storageKey) !== null && deseralizeData(storage.getItem(storageKey));
    return valueInStorage?.hasOwnProperty(keyRef.current) &&
      valueInStorage[keyRef.current] !== undefined
      ? valueInStorage[keyRef.current]
      : defaultValueRef.current;
  });
  const dataRef = React.useRef<T>(data);
  dataRef.current = data;

  const storageUpdated = React.useCallback(
    (event: StorageEvent) => {
      if (event.storageArea === storage && event.key === storageKey) {
        const configMapData = deseralizeData(event.newValue);
        const newData = configMapData?.[keyRef.current];

        if (newData !== undefined && seralizeData(newData) !== seralizeData(dataRef.current)) {
          setData(newData);
        }
      }
    },
    [storageKey, storage],
  );

  React.useEffect(() => {
    if (sync) {
      window.addEventListener('storage', storageUpdated);
    }
    return () => {
      if (sync) {
        window.removeEventListener('storage', storageUpdated);
      }
    };
  }, [storageUpdated, sync]);

  const updateData = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action: React.SetStateAction<T>) => {
      const previousData = dataRef.current;
      const newState =
        typeof action === 'function' ? (action as (prevState: T) => T)(previousData) : action;
      const configMapData = deseralizeData(storage.getItem(storageKey)) ?? {};
      if (
        newState !== undefined &&
        seralizeData(newState) !== seralizeData(configMapData?.[keyRef.current])
      ) {
        setData(newState);
        const dataToUpdate = {
          ...configMapData,
          ...{
            [keyRef.current]: newState,
          },
        };
        const newValue = seralizeData(dataToUpdate);

        // create a storage event to dispatch locally since browser windows do not fire the
        // storage event if the change originated from the current window
        const event = new StorageEvent('storage', {
          storageArea: storage,
          key: storageKey,
          newValue,
          oldValue: storage.getItem(storageKey),
          url: window.location.toString(),
        });

        try {
          // update storage
          storage.setItem(storageKey, newValue);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`Error while updating local storage for key ${storageKey}`, err);
        }

        // dispatch storage event
        window.dispatchEvent(event);
      }
    },
    [storageKey, storage],
  );

  return [data, updateData];
};
