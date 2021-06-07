import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { ConfigMapModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useUserSettingsLocalStorage } from './useUserSettingsLocalStorage';
import {
  createConfigMap,
  deseralizeData,
  seralizeData,
  updateConfigMap,
  USER_SETTING_CONFIGMAP_NAMESPACE,
} from '../utils/user-settings';

const alwaysUseFallbackLocalStorage = window.SERVER_FLAGS.userSettingsLocation === 'localstorage';
if (alwaysUseFallbackLocalStorage) {
  // eslint-disable-next-line no-console
  console.info('user-settings will be stored in localstorage instead of configmap.');
}

const useCounterRef = (initialValue: number = 0): [boolean, () => void, () => void] => {
  const counterRef = React.useRef<number>(initialValue);
  const increment = React.useCallback(() => {
    counterRef.current += 1;
  }, []);
  const decrement = React.useCallback(() => {
    counterRef.current -= 1;
  }, []);
  return [counterRef.current !== initialValue, increment, decrement];
};

export const useUserSettings = <T>(
  key: string,
  defaultValue?: T,
  sync: boolean = false,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const impersonate = useSelector((state: RootState) => !!state.UI.get('impersonate'));
  const keyRef = React.useRef<string>(key);
  const defaultValueRef = React.useRef<T>(defaultValue);
  const [isRequestPending, increaseRequest, decreaseRequest] = useCounterRef();
  const userUid = useSelector(
    (state: RootState) =>
      state.UI.get('impersonate')?.name ?? state.UI.get('user')?.metadata?.uid ?? 'kubeadmin',
  );

  const [fallbackLocalStorage, setFallbackLocalStorage] = React.useState<boolean>(
    alwaysUseFallbackLocalStorage,
  );

  const isLocalStorage = fallbackLocalStorage || impersonate;

  const configMapResource = React.useMemo(
    () =>
      isLocalStorage
        ? null
        : {
            kind: ConfigMapModel.kind,
            namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
            isList: false,
            name: `user-settings-${userUid}`,
          },
    [userUid, isLocalStorage],
  );
  const [cfData, cfLoaded, cfLoadError] = useK8sWatchResource<K8sResourceKind>(configMapResource);
  const [settings, setSettings] = React.useState<T>();
  const settingsRef = React.useRef<T>(settings);
  settingsRef.current = settings;
  const [loaded, setLoaded] = React.useState(false);

  const [lsData, setLsDataCallback] = useUserSettingsLocalStorage(
    alwaysUseFallbackLocalStorage && !impersonate
      ? 'console-user-settings'
      : `console-user-settings-${userUid}`,
    keyRef.current,
    defaultValueRef.current,
    isLocalStorage && sync,
    impersonate,
  );

  React.useEffect(() => {
    if (isLocalStorage) {
      return;
    }
    if (cfLoadError?.response?.status === 404 || (!cfData && cfLoaded)) {
      (async () => {
        try {
          await createConfigMap();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(err);
          setFallbackLocalStorage(true);
        }
      })();
    } else if (
      /**
       * update settings if key is present in config map but data is not equal to settings
       */
      cfData &&
      cfLoaded &&
      cfData.data?.hasOwnProperty(keyRef.current) &&
      seralizeData(settings) !== cfData.data[keyRef.current]
    ) {
      setSettings(deseralizeData(cfData.data[keyRef.current]));
      setLoaded(true);
    } else if (
      /**
       * if key doesn't exist in config map send patch request to add the key with default value
       */
      defaultValueRef.current !== undefined &&
      cfData &&
      cfLoaded &&
      !cfData.data?.hasOwnProperty(keyRef.current)
    ) {
      updateConfigMap(cfData, keyRef.current, seralizeData(defaultValueRef.current));
      setSettings(defaultValueRef.current);
      setLoaded(true);
    } else if (cfLoaded && !cfLoadError) {
      setSettings(defaultValueRef.current);
      setLoaded(true);
    } else if (cfLoadError && cfLoadError.response?.status !== 404) {
      setFallbackLocalStorage(true);
    }
    // This effect should only be run on change of configmap data, status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfLoadError, cfLoaded, isLocalStorage]);

  const callback = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action: React.SetStateAction<T>) => {
      const previousSettings = settingsRef.current;
      const newState =
        typeof action === 'function' ? (action as (prevState: T) => T)(previousSettings) : action;
      setSettings(newState);
      if (cfLoaded) {
        increaseRequest();
        updateConfigMap(cfData, keyRef.current, seralizeData(newState))
          .then(() => {
            decreaseRequest();
          })
          .catch(() => {
            decreaseRequest();
            setSettings(previousSettings);
          });
      }
    },
    [cfData, cfLoaded, decreaseRequest, increaseRequest],
  );

  const resultedSettings = React.useMemo(() => {
    if (sync && cfLoaded && cfData && !isRequestPending) {
      /**
       * If key is deleted from the config map then return default value
       */
      if (!cfData.data?.hasOwnProperty(keyRef.current) && settings !== undefined) {
        return defaultValueRef.current;
      }
      if (seralizeData(settingsRef.current) !== cfData?.data?.[keyRef.current]) {
        return deseralizeData(cfData?.data?.[keyRef.current]);
      }
    }
    return settings;
  }, [sync, isRequestPending, cfData, cfLoaded, settings]);
  settingsRef.current = resultedSettings;

  return isLocalStorage ? [lsData, setLsDataCallback, true] : [resultedSettings, callback, loaded];
};
