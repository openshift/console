import { useMemo, useRef } from 'react';
import { useExtensions as useExtensionsSDK } from '@openshift/dynamic-plugin-sdk';
import type {
  Extension,
  ExtensionTypeGuard,
  LoadedExtension,
} from '@console/dynamic-plugin-sdk/src/types';
import { dynamicPluginNames } from '../utils/allowed-plugins';
import { useTranslatedExtensions } from '../utils/useTranslatedExtensions';

const pluginOrderMap = new Map(dynamicPluginNames.map((name, index) => [name, index]));

/**
 * OCPBUGS-43792: Sort extensions by the order in {@link dynamicPluginNames}, so
 * that the order can be controlled using the console operator config.
 *
 * The extensions will resolve in the same order as the list of enabled plugins
 * in the console operator config. This means that cluster admins can choose
 * which plugin takes priority when there are extension collisions for extension
 * points like the Project modal where only one extension can be resolved and rendered.
 *
 * Extensions from plugins not in the list (static plugins) are placed at the start.
 */
const sortExtensionsByPluginOrder = <E extends Extension>(
  extensions: LoadedExtension<E>[],
): LoadedExtension<E>[] => {
  return [...extensions].sort(
    (a, b) =>
      (pluginOrderMap.get(a.pluginName) ?? Number.MIN_SAFE_INTEGER) -
      (pluginOrderMap.get(b.pluginName) ?? Number.MIN_SAFE_INTEGER),
  );
};

/**
 * React hook for consuming Console extensions.
 *
 * This hook takes extension type guard(s) as its argument(s) and returns a list
 * of extension instances, narrowed by the given type guard(s), which are currently
 * in use.
 *
 * An extension is considered to be in use when
 *
 * - it is an always-on extension, i.e. not gated by any feature flags
 * - all feature flags referenced by its `flags` object are resolved to the right
 *   values
 *
 * When the list of matching extensions changes, the React component is re-rendered
 * with the hook returning an up-to-date list of extensions.
 *
 * Example usage:
 *
 * ```ts
 * const Example = () => {
 *   const navItemExtensions = useExtensions<NavItem>(isNavItem);
 *   // process extensions and render your component
 * };
 * ```
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 *
 * @param typeGuards Type guard(s) used to narrow the extension instances.
 *
 * @returns List of extension instances which are currently in use, narrowed by the
 * given type guard(s).
 */
export const useExtensions = <E extends Extension>(
  ...typeGuards: ExtensionTypeGuard<E>[]
): LoadedExtension<E>[] => {
  if (typeGuards.length === 0) {
    throw new Error('You must pass at least one type guard to useExtensions');
  }

  const extensions = useExtensionsSDK(...typeGuards);
  const translatedExtensions = useTranslatedExtensions<E>(extensions);

  // Track the previous result and UIDs for referential stability
  const previousResultRef = useRef<LoadedExtension<E>[]>([]);
  const previousUIDsRef = useRef<string>('');

  return useMemo(() => {
    const sorted = sortExtensionsByPluginOrder(translatedExtensions);
    const currentUIDs = sorted.map((e) => e.uid).join(',');

    // Return previous result if the extensions haven't changed
    if (currentUIDs === previousUIDsRef.current) {
      return previousResultRef.current;
    }

    // Update refs and return new result
    previousResultRef.current = sorted;
    previousUIDsRef.current = currentUIDs;

    return sorted;
  }, [translatedExtensions]);
};
