import { useState, useEffect, useMemo } from 'react';
import type { PluginInfoEntry } from '@openshift/dynamic-plugin-sdk';
import { flagPending } from '@console/internal/reducers/features';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';

const FLAG_SETTLING_TIMEOUT_MS = 3000;

/**
 * Checks whether all loaded plugin feature flags have settled.
 *
 * When a dynamic plugin finishes loading, its `console.flag/hookProvider`
 * extensions run asynchronously. Until a hookProvider calls `setFeatureFlag`,
 * its flag value is `undefined` (pending) in Redux. Routes gated on those
 * flags are invisible to the router during this window.
 *
 * This hook inspects each loaded plugin's `manifest.extensions` for required
 * flags that are still pending, and includes a timeout fallback so that
 * broken hookProviders do not permanently block the 404 catch-all.
 *
 * @param pluginInfoEntries - current plugin information from `usePluginInfo()`
 * @returns `true` when all plugin flags have resolved or the timeout has elapsed
 */
export const usePluginFlagsSettled = (pluginInfoEntries: PluginInfoEntry[]): boolean => {
  const reduxFlags = useConsoleSelector((state) => state.FLAGS);

  const hasPendingPluginFlags = useMemo(
    () =>
      pluginInfoEntries.some((entry) => {
        if (entry.status === 'pending' || entry.status === 'failed') return false;
        const extensions = entry.manifest?.extensions;
        if (!Array.isArray(extensions)) return false;
        return extensions.some((ext) => {
          const required = ext.flags?.required;
          if (!Array.isArray(required) || required.length === 0) return false;
          return required.some((flagName: string) => flagPending(reduxFlags[flagName]));
        });
      }),
    [pluginInfoEntries, reduxFlags],
  );

  const [flagSettlingTimedOut, setFlagSettlingTimedOut] = useState(false);

  const [prevHasPending, setPrevHasPending] = useState(false);
  if (prevHasPending && !hasPendingPluginFlags) {
    setFlagSettlingTimedOut(false);
  }
  if (prevHasPending !== hasPendingPluginFlags) {
    setPrevHasPending(hasPendingPluginFlags);
  }

  useEffect(() => {
    if (!hasPendingPluginFlags || flagSettlingTimedOut) {
      return;
    }

    const timer = setTimeout(() => setFlagSettlingTimedOut(true), FLAG_SETTLING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [hasPendingPluginFlags, flagSettlingTimedOut]);

  return !hasPendingPluginFlags || flagSettlingTimedOut;
};
