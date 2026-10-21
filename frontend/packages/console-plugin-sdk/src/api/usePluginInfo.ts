import { useMemo } from 'react';
import { usePluginInfo as usePluginInfoSDK } from '@openshift/dynamic-plugin-sdk';

/**
 * React hook for consuming current Console dynamic plugin information.
 *
 * This hook re-renders the component whenever the plugin information changes.
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 *
 * @example
 * ```ts
 * const Example = () => {
 *   const infoEntries = usePluginInfo();
 *   // process info entries and render your component
 * };
 * ```
 *
 * @returns Current information on all Console plugins (excluding static plugins).
 */
export const usePluginInfo: typeof usePluginInfoSDK = () => {
  const infoEntries = usePluginInfoSDK();

  return useMemo(() => infoEntries.filter((p) => p.manifest.registrationMethod !== 'local'), [
    infoEntries,
  ]);
};
