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
  watch: boolean = true,
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

  const localStorageUpdated = React.useCallback(
    (ev: StorageEvent) => {
      if (ev.key === storageConfigNameRef.current) {
        const lsConfigMapData = deseralizeData(localStorage.getItem(storageConfigNameRef.current));
        if (
          lsData !== undefined &&
          lsConfigMapData?.[keyRef.current] &&
          seralizeData(lsConfigMapData[keyRef.current]) !== seralizeData(lsData)
        ) {
          setLsData(lsConfigMapData[keyRef.current]);
        }
      }
    },
    [lsData],
  );
  React.useEffect(() => {
    if (watch) {
      window.addEventListener('storage', localStorageUpdated);
    }
    return () => {
      if (watch) {
        window.removeEventListener('storage', localStorageUpdated);
      }
    };
  }, [localStorageUpdated, watch]);

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
        localStorage.setItem(storageConfigNameRef.current, seralizeData(dataToUpdate));
      }
    },
    [],
  );

  return [lsData, updateLsData];
};
