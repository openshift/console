import { useRef, useCallback, useEffect } from 'react';
import { useForceRender } from '@console/shared/src/hooks/useForceRender';
import { DynamicPluginInfo } from '../store';
import { subscribeToDynamicPlugins } from './pluginSubscriptionService';

/**
 * React hook for consuming Console dynamic plugin runtime information.
 *
 * When the runtime status of a dynamic plugin changes, the React component
 * is re-rendered with the hook returning an up-to-date plugin information.
 *
 * Example usage:
 *
 * ```ts
 * const Example = () => {
 *   const pluginInfoEntries = usePluginInfo();
 *   // process plugin entries and render your component
 * };
 * ```
 *
 * The hook's result elements are guaranteed to be referentially stable across re-renders.
 *
 * @returns Console dynamic plugin runtime information.
 */
export const usePluginInfo = (): DynamicPluginInfo[] => {
  const forceRender = useForceRender();

  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<VoidFunction>(null);
  const pluginInfoEntriesRef = useRef<DynamicPluginInfo[]>([]);

  const trySubscribe = useCallback(() => {
    if (unsubscribeRef.current === null) {
      unsubscribeRef.current = subscribeToDynamicPlugins((pluginInfoEntries) => {
        pluginInfoEntriesRef.current = pluginInfoEntries;
        isMountedRef.current && forceRender();
      });
    }
  }, [forceRender]);

  const tryUnsubscribe = useCallback(() => {
    if (unsubscribeRef.current !== null) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  trySubscribe();

  useEffect(
    () => () => {
      isMountedRef.current = false;
      tryUnsubscribe();
    },
    [tryUnsubscribe],
  );

  return pluginInfoEntriesRef.current;
};
