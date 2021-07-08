import * as React from 'react';
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
 *   const pluginEntries = useDynamicPluginInfo();
 *   // process plugin entries and render your component
 * };
 * ```
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 *
 * @returns Console dynamic plugin runtime information.
 */
export const useDynamicPluginInfo = (): DynamicPluginInfo[] => {
  const forceRender = useForceRender();

  const isMountedRef = React.useRef(true);
  const unsubscribeRef = React.useRef<VoidFunction>(null);
  const pluginEntriesRef = React.useRef<DynamicPluginInfo[]>([]);

  const trySubscribe = React.useCallback(() => {
    if (unsubscribeRef.current === null) {
      unsubscribeRef.current = subscribeToDynamicPlugins((pluginEntries) => {
        pluginEntriesRef.current = pluginEntries;
        isMountedRef.current && forceRender();
      });
    }
  }, [forceRender]);

  const tryUnsubscribe = React.useCallback(() => {
    if (unsubscribeRef.current !== null) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  trySubscribe();

  React.useEffect(
    () => () => {
      isMountedRef.current = false;
      tryUnsubscribe();
    },
    [tryUnsubscribe],
  );

  return pluginEntriesRef.current;
};
