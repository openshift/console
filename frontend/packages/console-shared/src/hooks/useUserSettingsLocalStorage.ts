import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { deseralizeData, seralizeData } from '../utils/user-settings';

const CONFIGMAP_LS_KEY = 'console-user-settings';

export const useUserSettingsLocalStorage = <T>(
  key: string,
  defaultValue: T,
  sync: boolean = false,
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const keyRef = React.useRef(key);
  const defaultValueRef = React.useRef(defaultValue);
  const userUid = useSelector(
    (state: RootState) => state.UI.get('user')?.metadata?.uid ?? 'kubeadmin',
  );
  const storageConfigNameRef = React.useRef(`${CONFIGMAP_LS_KEY}-${userUid}`);
  const [lsData, setLsData] = React.useState(() => {
    const valueInLocalStorage =
      localStorage.getItem(storageConfigNameRef.current) !== null &&
      deseralizeData(localStorage.getItem(storageConfigNameRef.current));
    return valueInLocalStorage?.hasOwnProperty(keyRef.current) &&
      valueInLocalStorage[keyRef.current]
      ? valueInLocalStorage[keyRef.current]
      : defaultValueRef.current;
  });
  const lsDataRef = React.useRef<T>(lsData);
  lsDataRef.current = lsData;

  const localStorageUpdated = React.useCallback((event: StorageEvent) => {
    if (event.key === storageConfigNameRef.current) {
      const lsConfigMapData = deseralizeData(event.newValue);
      const newData = lsConfigMapData?.[keyRef.current];
      if (newData && seralizeData(newData) !== seralizeData(lsDataRef.current)) {
        setLsData(newData);
      }
    }
  }, []);

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
      const lsConfigMapData =
        deseralizeData(localStorage.getItem(storageConfigNameRef.current)) ?? {};
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
          key: storageConfigNameRef.current,
          newValue,
          oldValue: localStorage.getItem(storageConfigNameRef.current),
          url: window.location.toString(),
        });

        // update local storage
        localStorage.setItem(storageConfigNameRef.current, newValue);

        // dispatch local event
        window.dispatchEvent(event);
      }
    },
    [],
  );

  return [lsData, updateLsData];
};
