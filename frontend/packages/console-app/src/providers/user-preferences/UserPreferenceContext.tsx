import type { FC, ReactNode } from 'react';
import { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { getImpersonate, getUser } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConfigMapModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import {
  createConfigMap,
  deserializeData,
  hashUsernameForSettings,
  updateConfigMap,
  USER_SETTING_CONFIGMAP_NAMESPACE,
} from '@console/shared/src/utils/user-settings';

const alwaysUseFallbackLocalStorage = window.SERVER_FLAGS.userSettingsLocation === 'localstorage';

if (alwaysUseFallbackLocalStorage) {
  // eslint-disable-next-line no-console
  console.info('user-settings will be stored in localstorage instead of configmap.');
}

/**
 * A snapshot of all user settings. `data` maps each (sanitized) key to its
 * serialized (JSON string) value, matching the ConfigMap `data` format so that
 * both the ConfigMap and localStorage backends can be consumed uniformly.
 */
export interface UserSettingsSnapshot {
  data: { [key: string]: string };
  loaded: boolean;
  isLocalStorage: boolean;
}

export interface UserSettingsStore {
  subscribe: (listener: VoidFunction) => VoidFunction;
  getSnapshot: () => UserSettingsSnapshot;
  /**
   * Persist a single already-serialized value for the given sanitized key.
   * Resolves once the value has been written. Rejects (after reverting any
   * optimistic snapshot update) so callers can revert their own local copy.
   *
   * Before a storage backend is wired up this is a no-op; that window is safe
   * because writes are gated on `loaded`, which only becomes `true` from inside
   * a backend once it has also installed the real implementation.
   */
  updateKey: (sanitizedKey: string, serializedValue: string) => Promise<void>;
}

interface MutableUserSettingsStore extends UserSettingsStore {
  setSnapshot: (next: UserSettingsSnapshot) => void;
  setUpdateKey: (fn: UserSettingsStore['updateKey']) => void;
}

// Sentinel meaning "no same-window synthetic storage event is pending". Distinct
// from any real `StorageEvent.newValue` (always `string | null`) so it can never
// collide with a genuine cross-tab event, in particular a key removal, whose
// `newValue` is `null`.
const NO_PENDING_SYNTHETIC_STORAGE_EVENT = Symbol('no-pending-synthetic-storage-event');

const EMPTY_SNAPSHOT: UserSettingsSnapshot = {
  data: {},
  loaded: false,
  isLocalStorage: alwaysUseFallbackLocalStorage,
};

export const createUserSettingsStore = (): MutableUserSettingsStore => {
  let snapshot: UserSettingsSnapshot = EMPTY_SNAPSHOT;
  let updateKey: UserSettingsStore['updateKey'] = async () => {};
  const listeners = new Set<VoidFunction>();
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setSnapshot: (next) => {
      if (
        next.loaded !== snapshot.loaded ||
        next.isLocalStorage !== snapshot.isLocalStorage ||
        next.data !== snapshot.data
      ) {
        snapshot = next;
        listeners.forEach((listener) => listener());
      }
    },
    updateKey: (sanitizedKey, serializedValue) => updateKey(sanitizedKey, serializedValue),
    setUpdateKey: (fn) => {
      updateKey = fn;
    },
  };
};

/** @internal - this should only be used by `useUserPreference`. */
export const UserPreferenceContext = createContext<UserSettingsStore | null>(null);

const getStorageKey = (userUid: string, impersonate: boolean): string =>
  alwaysUseFallbackLocalStorage && !impersonate
    ? 'console-user-settings'
    : `console-user-settings-${userUid}`;

// Convert a parsed localStorage object ({ key: nativeValue }) into the
// serialized-per-key form used by the store snapshot.
const localStorageObjectToData = (obj: unknown): UserSettingsSnapshot['data'] => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  return Object.entries(obj).reduce(
    (acc, [key, value]) => {
      acc[key] = JSON.stringify(value);
      return acc;
    },
    {} as UserSettingsSnapshot['data'],
  );
};

// Optimistically write a single serialized value into the shared store ahead of
// the backend confirming it, so consumers reflect the change immediately.
const optimisticallySetKey = (
  store: MutableUserSettingsStore,
  sanitizedKey: string,
  serializedValue: string,
): void => {
  const snapshot = store.getSnapshot();
  store.setSnapshot({
    ...snapshot,
    data: { ...snapshot.data, [sanitizedKey]: serializedValue },
  });
};

// Undo an optimistic update after a failed write, restoring the key to its
// previous serialized value (or removing it when it had none). Rebased on the
// latest snapshot so a concurrent write to a different key is preserved.
const revertKey = (
  store: MutableUserSettingsStore,
  sanitizedKey: string,
  previousValue: string | undefined,
): void => {
  const snapshot = store.getSnapshot();
  const data = { ...snapshot.data };
  if (previousValue === undefined) {
    delete data[sanitizedKey];
  } else {
    data[sanitizedKey] = previousValue;
  }
  store.setSnapshot({ ...snapshot, data });
};

/**
 * The user's identity and the resulting choice of storage backend.
 *
 * `isLocalStorage` is `true` when settings must be kept in browser storage
 * rather than a ConfigMap: when configured globally, while impersonating, or
 * after the ConfigMap backend has been found to be unavailable (via
 * `setFallbackLocalStorage`).
 */
interface UserSettingsIdentity {
  userUid: string;
  isLocalStorage: boolean;
  storage: Storage;
  storageKey: string;
  setFallbackLocalStorage: (fallback: boolean) => void;
}

const useUserSettingsIdentity = (): UserSettingsIdentity => {
  const userUid = useConsoleSelector((state) => {
    const impersonateName = getImpersonate(state)?.name;
    const { uid, username } = getUser(state) ?? {};
    const hashName = hashUsernameForSettings(username, uid);
    return impersonateName || hashName || '';
  });
  const impersonate: boolean = useConsoleSelector((state) => !!getImpersonate(state));

  // Set to `true` when the ConfigMap backend is unavailable and we need to fall
  // back to localStorage.
  const [fallbackLocalStorage, setFallbackLocalStorage] = useState<boolean>(false);

  const isLocalStorage = alwaysUseFallbackLocalStorage || impersonate || fallbackLocalStorage;
  const storageKey = getStorageKey(userUid, impersonate);
  const storage = impersonate ? window.sessionStorage : window.localStorage;

  return { userUid, isLocalStorage, storage, storageKey, setFallbackLocalStorage };
};

/**
 * localStorage/sessionStorage backend: populates the store, keeps it in sync
 * with cross-tab changes, and wires up writes. Only active while
 * `isLocalStorage` is `true`.
 */
const useLocalStorageBackend = (
  store: MutableUserSettingsStore,
  enabled: boolean,
  { isLocalStorage, storage, storageKey }: UserSettingsIdentity,
): void => {
  // Remembers the value of our most recent same-window synthetic storage event
  // so our own `onStorage` listener can ignore it: the write path already
  // updated the store optimistically, and reprocessing the echo would rebuild a
  // fresh (reference-unequal) data object and trigger a redundant store update.
  const lastSyntheticValueRef = useRef<string | typeof NO_PENDING_SYNTHETIC_STORAGE_EVENT>(
    NO_PENDING_SYNTHETIC_STORAGE_EVENT,
  );

  // Wire up writes to browser storage.
  useEffect(() => {
    if (!enabled || !isLocalStorage) {
      return;
    }
    store.setUpdateKey(async (sanitizedKey, serializedValue) => {
      const previousValue = store.getSnapshot().data[sanitizedKey];
      const current = deserializeData(storage.getItem(storageKey)) ?? {};
      const nativeValue = deserializeData(serializedValue);
      const updated = { ...current, [sanitizedKey]: nativeValue };
      const newValue = JSON.stringify(updated);
      const oldValue = storage.getItem(storageKey);

      // Optimistically update the shared store.
      optimisticallySetKey(store, sanitizedKey, serializedValue);

      try {
        storage.setItem(storageKey, newValue);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Error while updating storage for key ${storageKey}`, err);
        // Roll back the optimistic update and surface the failure so the caller
        // can revert its local copy too.
        revertKey(store, sanitizedKey, previousValue);
        throw err;
      }

      // Same-window updates do not fire the browser storage event, so
      // dispatch one manually for any external listeners. Record the value first
      // so our own listener can skip this echo (see `onStorage` below).
      lastSyntheticValueRef.current = newValue;
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: storage,
          key: storageKey,
          newValue,
          oldValue,
          url: window.location.toString(),
        }),
      );
    });
  }, [enabled, isLocalStorage, storage, storageKey, store]);

  // Populate the store and listen for cross-tab changes.
  useEffect(() => {
    if (!enabled || !isLocalStorage) {
      return undefined;
    }
    store.setSnapshot({
      data: localStorageObjectToData(deserializeData(storage.getItem(storageKey))),
      loaded: true,
      isLocalStorage: true,
    });

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === storage && event.key === storageKey) {
        // Ignore the echo of our own same-window write (dispatched above); the
        // write path already updated the store optimistically. A genuine
        // cross-tab event carrying the same value is a no-op anyway.
        if (event.newValue === lastSyntheticValueRef.current) {
          lastSyntheticValueRef.current = NO_PENDING_SYNTHETIC_STORAGE_EVENT;
          return;
        }
        store.setSnapshot({
          data: localStorageObjectToData(deserializeData(event.newValue)),
          loaded: true,
          isLocalStorage: true,
        });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [enabled, isLocalStorage, storage, storageKey, store]);
};

/**
 * ConfigMap backend: watches the user's settings ConfigMap, mirrors it into the
 * store, creates it on first use, wires up writes, and falls back to
 * localStorage when the ConfigMap is unavailable. Only active while
 * `isLocalStorage` is `false`.
 */
const useConfigMapBackend = (
  store: MutableUserSettingsStore,
  enabled: boolean,
  { userUid, isLocalStorage, setFallbackLocalStorage }: UserSettingsIdentity,
): void => {
  const configMapResource = useMemo(
    () =>
      !enabled || !userUid || isLocalStorage
        ? null
        : {
            kind: ConfigMapModel.kind,
            namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
            isList: false,
            name: `user-settings-${userUid}`,
          },
    [enabled, userUid, isLocalStorage],
  );
  const [cfData, cfLoaded, cfLoadError] = useK8sWatchResource<K8sResourceKind>(configMapResource);

  // Fall back to localStorage on an unexpected watch error (anything other than
  // the expected 404/403 handled below).
  useEffect(() => {
    if (
      enabled &&
      !isLocalStorage &&
      userUid &&
      cfLoadError &&
      cfLoadError.response?.status !== 404 &&
      cfLoadError.response?.status !== 403
    ) {
      setFallbackLocalStorage(true);
    }
  }, [enabled, isLocalStorage, userUid, cfLoadError, setFallbackLocalStorage]);

  // Keep the latest ConfigMap available to the updateKey callback.
  const cfDataRef = useRef<K8sResourceKind>(cfData);
  useEffect(() => {
    cfDataRef.current = cfData;
  }, [cfData]);

  // Guard against firing a second ConfigMap creation while the first POST is
  // still in flight: the mirror effect can re-run (e.g. the watch re-delivers a
  // fresh 404 error reference) before the watch delivers the newly created
  // ConfigMap. A concurrent duplicate POST can 409, whose catch would wrongly
  // demote a user with a working ConfigMap to localStorage. Reset in `finally`
  // so a later userUid change can still create that user's ConfigMap.
  const creatingRef = useRef(false);

  // When switching into ConfigMap mode (e.g. impersonation just ended), the
  // snapshot may still be marked `loaded` by the previous localStorage/
  // sessionStorage backend. Reset it to unloaded until the ConfigMap watch
  // delivers data, so that writes stay gated (the ConfigMap updateKey needs
  // ConfigMap metadata, which isn't available yet) and consumers re-seed from
  // the ConfigMap rather than persisting against a ConfigMap that hasn't loaded.
  useEffect(() => {
    if (!enabled || isLocalStorage) {
      return;
    }
    if (store.getSnapshot().isLocalStorage) {
      store.setSnapshot({ data: {}, loaded: false, isLocalStorage: false });
    }
  }, [enabled, isLocalStorage, store]);

  // Wire up writes to the ConfigMap.
  useEffect(() => {
    if (!enabled || isLocalStorage) {
      return;
    }
    store.setUpdateKey(async (sanitizedKey, serializedValue) => {
      const previousValue = store.getSnapshot().data[sanitizedKey];
      // Optimistically update the shared store; the watch will deliver the
      // authoritative value shortly after.
      optimisticallySetKey(store, sanitizedKey, serializedValue);
      try {
        await updateConfigMap(cfDataRef.current, sanitizedKey, serializedValue);
      } catch (err) {
        // Roll back the optimistic update and surface the failure so the caller
        // can revert its local copy too.
        revertKey(store, sanitizedKey, previousValue);
        throw err;
      }
    });
  }, [enabled, isLocalStorage, store]);

  // Mirror the watched ConfigMap into the store and handle creation / fallback.
  useEffect(() => {
    if (!enabled || isLocalStorage || !userUid) {
      return;
    }
    if (
      // Expected load error (404 Not found) for kubeadmin or other admins,
      // who have access to the complete openshift-console-user-settings namespace.
      cfLoadError?.response?.status === 404 ||
      // Expected load error (403 Forbidden) for all other (restricted) users,
      // which have no access to non-existing ConfigMaps in
      // openshift-console-user-settings namespace.
      cfLoadError?.response?.status === 403 ||
      (!cfData && cfLoaded)
    ) {
      if (!creatingRef.current) {
        creatingRef.current = true;
        (async () => {
          try {
            await createConfigMap();
            // The watch will deliver the newly created (empty) ConfigMap.
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Could not create ConfigMap for user settings:', err);
            setFallbackLocalStorage(true);
          } finally {
            creatingRef.current = false;
          }
        })();
      }
    } else if (cfData && cfLoaded) {
      store.setSnapshot({
        data: cfData.data ?? {},
        loaded: true,
        isLocalStorage: false,
      });
    }
  }, [
    enabled,
    isLocalStorage,
    userUid,
    cfData,
    cfLoaded,
    cfLoadError,
    store,
    setFallbackLocalStorage,
  ]);
};

/**
 * Runs a single watch (or localStorage sync) that feeds the given store.
 *
 * Used by {@link UserPreferenceProvider} to power the shared store consumed by
 * {@link useUserPreference}.
 *
 * Composes the user identity with the two mutually-exclusive storage backends;
 * only the backend matching `identity.isLocalStorage` does any work.
 */
const useUserSettingsSync = (store: MutableUserSettingsStore, enabled: boolean): void => {
  const identity = useUserSettingsIdentity();
  useLocalStorageBackend(store, enabled, identity);
  useConfigMapBackend(store, enabled, identity);
};

export const UserPreferenceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const store = useMemo(() => createUserSettingsStore(), []);
  useUserSettingsSync(store, true);
  return <UserPreferenceContext.Provider value={store}>{children}</UserPreferenceContext.Provider>;
};
