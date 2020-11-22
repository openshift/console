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

export const useUserSettings = <T>(
  key: string,
  defaultValue?: T,
  sync: boolean = false,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
  const defaultValueRef = React.useRef<T>(defaultValue);
  const keyRef = React.useRef<string>(key);
  const isRequestPending = React.useRef<boolean>(false);
  const userUid = useSelector(
    (state: RootState) => state.UI.get('user')?.metadata?.uid ?? 'kubeadmin',
  );
  const configMapResource = React.useMemo(
    () => ({
      kind: ConfigMapModel.kind,
      namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
      isList: false,
      name: `user-settings-${userUid}`,
    }),
    [userUid],
  );
  const [cfData, cfLoaded, cfLoadError] = useK8sWatchResource<K8sResourceKind>(configMapResource);
  const [settings, setSettings] = React.useState<T>();
  const settingsRef = React.useRef<T>(settings);
  settingsRef.current = settings;
  const [loaded, setLoaded] = React.useState(false);

  const [fallbackLocalStorage, setFallbackLocalStorage] = React.useState<boolean>(false);
  const [lsData, setLsDataCallback] = useUserSettingsLocalStorage(
    keyRef.current,
    defaultValueRef.current,
    fallbackLocalStorage,
  );

  React.useEffect(() => {
    if (!fallbackLocalStorage && (cfLoadError || (!cfData && cfLoaded))) {
      (async () => {
        try {
          await createConfigMap();
        } catch (err) {
          if (err?.response?.status === 403) {
            setFallbackLocalStorage(true);
          } else {
            setSettings(defaultValueRef.current);
            setLoaded(true);
          }
        }
      })();
    } else if (
      !fallbackLocalStorage &&
      cfData &&
      cfLoaded &&
      (!cfData.data?.hasOwnProperty(keyRef.current) ||
        seralizeData(settings) !== cfData.data?.[keyRef.current])
    ) {
      setSettings(deseralizeData(cfData.data?.[keyRef.current]) ?? defaultValueRef.current);
      setLoaded(true);
    } else if (!fallbackLocalStorage && cfLoaded) {
      setSettings(defaultValueRef.current);
      setLoaded(true);
    }
    // This effect should only be run on change of configmap data, status.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfLoadError, cfLoaded, fallbackLocalStorage]);

  React.useEffect(() => {
    if (sync && !isRequestPending.current) {
      if (
        cfData &&
        cfLoaded &&
        seralizeData(settingsRef.current) !== cfData?.data?.[keyRef.current]
      ) {
        setSettings(deseralizeData(cfData?.data?.[keyRef.current]));
      }
    }
  }, [cfData, cfLoaded, sync]);

  const callback = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (action: React.SetStateAction<T>) => {
      if (isRequestPending.current) return;
      const previousSettings = settingsRef.current;
      const newState =
        typeof action === 'function' ? (action as (prevState: T) => T)(previousSettings) : action;
      setSettings(newState);
      if (cfLoaded) {
        isRequestPending.current = true;
        updateConfigMap(cfData, keyRef.current, seralizeData(newState))
          .then(() => {
            isRequestPending.current = false;
          })
          .catch(() => {
            setSettings(previousSettings);
            isRequestPending.current = false;
          });
      }
    },
    [cfData, cfLoaded],
  );

  return fallbackLocalStorage ? [lsData, setLsDataCallback, true] : [settings, callback, loaded];
};
