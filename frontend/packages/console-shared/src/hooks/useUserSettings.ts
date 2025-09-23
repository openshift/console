import * as React from 'react';
import { useSelector } from 'react-redux';
import { UseUserSettings, getImpersonate, getUser } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConfigMapModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import {
  createConfigMap,
  deserializeData,
  seralizeData,
  updateConfigMap,
  USER_SETTING_CONFIGMAP_NAMESPACE,
} from '../utils/user-settings';
import { useUserSettingsLocalStorage } from './useUserSettingsLocalStorage';

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

export const useUserSettings: UseUserSettings = <T>(key, defaultValue, sync = false) => {
  // Mount status for safety state updates
  const mounted = React.useRef(true);
  React.useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  // Keys and values
  const keyRef = React.useRef<string>(key?.replace(/[^-._a-zA-Z0-9]/g, '_'));
  const defaultValueRef = React.useRef<T>(defaultValue);

  // Settings
  const [settings, setSettingsUnsafe] = React.useState<T>();
  const setSettings: typeof setSettingsUnsafe = React.useCallback(
    (...args) => mounted.current && setSettingsUnsafe(...args),
    [setSettingsUnsafe],
  );
  const settingsRef = React.useRef<T>(settings);
  settingsRef.current = settings;

  // Loaded
  const [loaded, setLoadedUnsafe] = React.useState(false);
  const setLoaded: typeof setLoadedUnsafe = React.useCallback(
    (...args) => mounted.current && setLoadedUnsafe(...args),
    [setLoadedUnsafe],
  );

  // Request counter
  const [isRequestPending, increaseRequest, decreaseRequest] = useCounterRef();

  const hashNameOrKubeadmin = async (name: string): Promise<string | null> => {
    if (!name) {
      return null;
    }

    if (name === 'kube:admin') {
      return 'kubeadmin';
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(name);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  };

  // User and impersonate
  const currentUser = useSelector((state: RootState) => {
    const impersonateName = getImpersonate(state)?.name;
    const { uid, username } = getUser(state) ?? {};
    return { impersonateName, uid, username };
  });

  const impersonate: boolean = useSelector((state: RootState) => !!getImpersonate(state));

  const [hashedUsername, setHashedUsername] = React.useState('');
  const [isHashingComplete, setIsHashingComplete] = React.useState(false);

  // Compute hash asynchronously when username changes
  React.useEffect(() => {
    if (currentUser.username) {
      setIsHashingComplete(false);
      hashNameOrKubeadmin(currentUser.username)
        .then((hash) => {
          if (mounted.current) {
            setHashedUsername(hash || '');
            setIsHashingComplete(true);
          }
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Failed to hash username:', error);
          if (mounted.current) {
            setHashedUsername('');
            setIsHashingComplete(true);
          }
        });
    } else {
      setHashedUsername('');
      setIsHashingComplete(true);
    }
  }, [currentUser.username]);

  // Compute final userUid once hashing is complete
  const userUid = React.useMemo(() => {
    if (
      !isHashingComplete &&
      currentUser.username &&
      !currentUser.impersonateName &&
      !currentUser.uid
    ) {
      // Still hashing, return empty string temporarily
      return '';
    }
    return currentUser.impersonateName || currentUser.uid || hashedUsername || '';
  }, [
    currentUser.impersonateName,
    currentUser.uid,
    hashedUsername,
    isHashingComplete,
    currentUser.username,
  ]);

  // Fallback
  const [fallbackLocalStorage, setFallbackLocalStorageUnsafe] = React.useState<boolean>(
    alwaysUseFallbackLocalStorage,
  );
  const setFallbackLocalStorage: typeof setFallbackLocalStorageUnsafe = React.useCallback(
    (...args) => mounted.current && setFallbackLocalStorageUnsafe(...args),
    [setFallbackLocalStorageUnsafe],
  );

  const isLocalStorage = fallbackLocalStorage || impersonate;
  const [lsData, setLsDataCallback] = useUserSettingsLocalStorage(
    alwaysUseFallbackLocalStorage && !impersonate
      ? 'console-user-settings'
      : `console-user-settings-${userUid}`,
    keyRef.current,
    defaultValueRef.current,
    isLocalStorage && sync,
    impersonate,
  );

  const configMapResource = React.useMemo(
    () =>
      !userUid || isLocalStorage
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

  React.useEffect(() => {
    if (!userUid || isLocalStorage) {
      return;
    }
    if (
      // Expected load error (404 Not found) for kubeadmin or other admins,
      // who have access to the complete openshift-console-user-settings namespace.
      cfLoadError?.response?.status === 404 ||
      // Expected load error (403 Forbidden) for all other (restricted) users,
      // which have no access to non-existing ConfigMaps in openshift-console-user-settings namespace.
      cfLoadError?.response?.status === 403 ||
      (!cfData && cfLoaded)
    ) {
      (async () => {
        try {
          await createConfigMap();
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Could not create ConfigMap for user settings:', err);
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
      setSettings(deserializeData(cfData.data[keyRef.current]));
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
      // Trigger update also when unmounted
      increaseRequest();
      updateConfigMap(cfData, keyRef.current, seralizeData(defaultValueRef.current))
        .then(() => {
          decreaseRequest();
        })
        .catch(() => {
          decreaseRequest();
        });
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
    [cfData, cfLoaded, decreaseRequest, increaseRequest, setSettings],
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
        return deserializeData(cfData?.data?.[keyRef.current]);
      }
    }
    return settings;
  }, [sync, isRequestPending, cfData, cfLoaded, settings]);
  settingsRef.current = resultedSettings;

  return isLocalStorage ? [lsData, setLsDataCallback, true] : [resultedSettings, callback, loaded];
};
