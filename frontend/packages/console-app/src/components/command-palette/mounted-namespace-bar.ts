import { useLayoutEffect, useState, useSyncExternalStore } from 'react';

export type MountedNamespaceBar = {
  onNamespaceChange?: (namespace: string) => void;
  isDisabled: boolean;
};

const mountedBars = new Map<symbol, MountedNamespaceBar>();

const listeners = new Set<() => void>();

let latestBar: MountedNamespaceBar | undefined;

const updateLatestBar = () => {
  latestBar = [...mountedBars.values()].pop();
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const getLatestBar = () => latestBar;

export const useRegisterNamespaceBar = (
  onNamespaceChange: ((namespace: string) => void) | undefined,
  isDisabled = false,
): void => {
  const [key] = useState(() => Symbol('namespace bar'));

  useLayoutEffect(() => {
    mountedBars.set(key, { onNamespaceChange, isDisabled });
    updateLatestBar();
  }, [key, onNamespaceChange, isDisabled]);

  useLayoutEffect(
    () => () => {
      mountedBars.delete(key);
      updateLatestBar();
    },
    [key],
  );
};

export const useMountedNamespaceBar = (): MountedNamespaceBar | undefined =>
  useSyncExternalStore(subscribe, getLatestBar);
