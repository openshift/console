import type { SetStateAction, Dispatch } from 'react';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import type { UseUserPreference } from '@console/dynamic-plugin-sdk';
import { deserializeData, serializeData } from '../utils/user-settings';
import type { UserSettingsSnapshot } from './UserPreferenceContext';
import { UserPreferenceContext } from './UserPreferenceContext';

const sanitizeKey = (key: string): string => key?.replace(/[^-._a-zA-Z0-9]/g, '_');

type SelectedState = {
  value?: string;
  loaded: boolean;
  isLocalStorage: boolean;
};

/**
 * Reads and writes a single user setting (user preference).
 *
 * Values are always serialized to JSON before being persisted, and only the
 * component listening to a given key re-renders when that key changes. When
 * `sync` is `true` the returned value tracks remote changes to the key; when it
 * is `false` the value is captured on load and only updated by the returned
 * setter.
 *
 * Reads and writes go through the shared {@link UserPreferenceContext} store,
 * which {@link UserPreferenceProvider} mounts at the app root. The provider is a
 * required ancestor; the hook throws if none is present.
 */
export const useUserPreference: UseUserPreference = <T>(
  key: string,
  defaultValue?: T,
  sync = false,
) => {
  const sanitizedKey = useMemo(() => sanitizeKey(key), [key]);
  // Freeze the default value at mount so later changes to the argument don't
  // re-trigger persistence, matching the original hook's behavior. State (not a
  // ref) so it can be read during render.
  const [frozenDefault] = useState<T | undefined>(defaultValue);

  // Reads and writes go through the shared store from <UserPreferenceProvider>,
  // which is mounted at the app root. It is a required ancestor so that every
  // consumer observes a single, consistent set of settings (rather than each
  // hook spinning up its own backend and diverging).
  const store = useContext(UserPreferenceContext);
  if (!store) {
    throw new Error('useUserPreference must be used within a <UserPreferenceProvider>');
  }

  // Subscribe with a per-key selector so this component only re-renders when it
  // needs to. When `sync` is false the value is intentionally omitted so remote
  // changes to the key do not trigger a re-render.
  const selected = useSyncExternalStoreWithSelector<UserSettingsSnapshot, SelectedState>(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
    (snapshot) =>
      sync
        ? {
            value: snapshot.data[sanitizedKey],
            loaded: snapshot.loaded,
            isLocalStorage: snapshot.isLocalStorage,
          }
        : { loaded: snapshot.loaded, isLocalStorage: snapshot.isLocalStorage },
    (a, b) => a.value === b.value && a.loaded === b.loaded && a.isLocalStorage === b.isLocalStorage,
  );
  const { loaded } = selected;

  const readStoreValue = (): T | undefined => {
    const raw = store.getSnapshot().data[sanitizedKey];
    return (raw !== undefined ? deserializeData(raw) : frozenDefault) as T;
  };

  // Local copy of the value: the source of truth for what the hook returns. It
  // is seeded from the store once loaded and thereafter changed only by the
  // setter and, when syncing, by remote updates.
  const [value, setValue] = useState<T | undefined>(() =>
    store.getSnapshot().loaded ? readStoreValue() : undefined,
  );
  const [seeded, setSeeded] = useState<boolean>(() => store.getSnapshot().loaded);
  // Last serialized store value we applied to `value`, so a remote change can be
  // detected across renders when syncing.
  const [appliedRaw, setAppliedRaw] = useState<string | undefined>(() =>
    store.getSnapshot().loaded ? store.getSnapshot().data[sanitizedKey] : undefined,
  );
  // The key `value`/`appliedRaw` currently reflect, so a change to the `key`
  // argument can be detected and the state re-seeded for the new key.
  const [appliedKey, setAppliedKey] = useState<string>(sanitizedKey);

  // The key whose default we've already persisted, so we persist a missing
  // default at most once per key (and again if the key changes).
  const persistedDefaultKeyRef = useRef<string | undefined>(undefined);

  if (sanitizedKey !== appliedKey) {
    // The key changed: re-seed from the new key's store value (or reset to
    // unseeded if the store isn't loaded yet). Without this a non-syncing
    // consumer would keep returning the previous key's value.
    const nowLoaded = store.getSnapshot().loaded;
    setAppliedKey(sanitizedKey);
    setSeeded(nowLoaded);
    setValue(nowLoaded ? readStoreValue() : undefined);
    setAppliedRaw(nowLoaded ? store.getSnapshot().data[sanitizedKey] : undefined);
  } else if (loaded && !seeded) {
    // Seed once the store becomes loaded (the ConfigMap backend loads async).
    setValue(readStoreValue());
    setAppliedRaw(store.getSnapshot().data[sanitizedKey]);
    setSeeded(true);
  } else if (sync && seeded && selected.value !== appliedRaw) {
    // Adopt a remote change to this key when syncing. A local write updates the
    // store optimistically to exactly this value first, so re-applying it here
    // is a harmless no-op for the value while keeping `appliedRaw` in sync.
    setValue(readStoreValue());
    setAppliedRaw(selected.value);
  }

  // Mirror the latest value into a ref so the setter can read it without being
  // re-created on every value change.
  const valueRef = useRef<T | undefined>(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Persist the default value into the ConfigMap when the key is missing.
  useEffect(() => {
    if (!loaded) {
      return;
    }
    const snapshot = store.getSnapshot();
    if (
      snapshot.data[sanitizedKey] === undefined &&
      !snapshot.isLocalStorage &&
      frozenDefault !== undefined &&
      persistedDefaultKeyRef.current !== sanitizedKey
    ) {
      persistedDefaultKeyRef.current = sanitizedKey;
      store.updateKey(sanitizedKey, serializeData(frozenDefault)).catch(() => {
        if (persistedDefaultKeyRef.current === sanitizedKey) {
          persistedDefaultKeyRef.current = undefined;
        }
      });
    }
  }, [loaded, store, sanitizedKey, frozenDefault]);

  const setUserPreference = useCallback<Dispatch<SetStateAction<T>>>(
    (action: SetStateAction<T>) => {
      const previousValue = valueRef.current;
      const newValue =
        typeof action === 'function' ? (action as (prevState: T) => T)(previousValue as T) : action;
      setValue(newValue);
      if (store.getSnapshot().loaded) {
        store.updateKey(sanitizedKey, serializeData(newValue)).catch(() => {
          setValue(previousValue);
        });
      }
    },
    [sanitizedKey, store],
  );

  return [value as T, setUserPreference, loaded && seeded];
};
