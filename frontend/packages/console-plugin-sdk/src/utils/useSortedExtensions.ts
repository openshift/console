import { useMemo, useRef } from 'react';
import type { Extension, LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import { dynamicPluginNames } from './allowed-plugins';

const pluginOrderMap = new Map(dynamicPluginNames.map((name, index) => [name, index]));

/**
 * OCPBUGS-43792: Extensions returned by `useExtensions` hook should be sorted according
 * to {@link dynamicPluginNames} which reflects the order of plugins in Console operator
 * config.
 */
const sortExtensionsByPluginOrder = <TExtension extends Extension>(
  extensions: LoadedExtension<TExtension>[],
) => {
  return [...extensions].sort(
    (a, b) =>
      (pluginOrderMap.get(a.pluginName) ?? Number.MIN_SAFE_INTEGER) -
      (pluginOrderMap.get(b.pluginName) ?? Number.MIN_SAFE_INTEGER),
  );
};

/**
 * Sort extensions in the same order as the list of enabled plugins in Console operator config.
 * This means that cluster admins can choose which plugin takes priority when there are extension
 * collisions for extension points like the Project modal where only one extension can take effect.
 *
 * Extensions contributed by Console static plugins are placed at the start.
 *
 * The hook assumes that `extensions` array is referentially stable across re-renders.
 *
 * This hook does not modify provided extension objects, it just changes their order within the array.
 *
 * @returns List of sorted extensions.
 */
export const useSortedExtensions = <TExtension extends Extension>(
  extensions: LoadedExtension<TExtension>[],
) => {
  // Track the previous result and UIDs for referential stability
  const prevResultRef = useRef<LoadedExtension<TExtension>[]>([]);
  const prevUIDsRef = useRef<string>('');

  return useMemo(() => {
    const sorted = sortExtensionsByPluginOrder(extensions);
    const currentUIDs = sorted.map((e) => e.uid).join(',');

    // Return previous result if the extensions haven't changed
    if (currentUIDs === prevUIDsRef.current) {
      return prevResultRef.current;
    }

    // Update refs and return new result
    prevResultRef.current = sorted;
    prevUIDsRef.current = currentUIDs;

    return sorted;
  }, [extensions]);
};
