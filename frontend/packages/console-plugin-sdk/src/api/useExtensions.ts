import { useRef, useCallback, useEffect } from 'react';
import * as _ from 'lodash';
import type {
  ExtensionDeclaration,
  ExtensionTypeGuard,
  LoadedExtension,
} from '@console/dynamic-plugin-sdk/src/types';
import { useForceRender } from '@console/shared/src/hooks/useForceRender';
import { useTranslatedExtensions } from '../utils/useTranslatedExtensions';
import { subscribeToExtensions } from './pluginSubscriptionService';

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
export const useExtensions = <E extends ExtensionDeclaration>(
  ...typeGuards: ExtensionTypeGuard<E>[]
): LoadedExtension<E>[] => {
  if (typeGuards.length === 0) {
    throw new Error('You must pass at least one type guard to useExtensions');
  }

  const forceRender = useForceRender();

  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<VoidFunction>(null);
  const extensionsInUseRef = useRef<LoadedExtension<E>[]>([]);
  const latestTypeGuardsRef = useRef<ExtensionTypeGuard<E>[]>(typeGuards);

  const trySubscribe = useCallback(() => {
    if (unsubscribeRef.current === null) {
      unsubscribeRef.current = subscribeToExtensions<E>((extensions) => {
        extensionsInUseRef.current = extensions;
        isMountedRef.current && forceRender();
      }, ...latestTypeGuardsRef.current);
    }
  }, [forceRender]);

  const tryUnsubscribe = useCallback(() => {
    if (unsubscribeRef.current !== null) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  if (!_.isEqual(latestTypeGuardsRef.current, typeGuards)) {
    latestTypeGuardsRef.current = typeGuards;
    tryUnsubscribe();
  }

  trySubscribe();

  useEffect(
    () => () => {
      isMountedRef.current = false;
      tryUnsubscribe();
    },
    [tryUnsubscribe],
  );

  return useTranslatedExtensions<E>(extensionsInUseRef.current);
};
