import * as React from 'react';
import * as _ from 'lodash';
import { subscribeToExtensions } from './subscribeToExtensions';
import { Extension, ExtensionTypeGuard, LoadedExtension } from './typings';

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
 * Example usage:
 *
 * ```ts
 * import {
 *   useExtensions,
 *   NavItem,
 *   Perspective,
 *   isNavItem,
 *   isPerspective,
 * } from '@console/plugin-sdk';
 *
 * const Example = () => {
 *   const navItemExtensions = useExtensions<NavItem>(isNavItem);
 *   const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
 *   // process extensions and render your component
 * };
 * ```
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

  const unsubscribeRef = React.useRef<VoidFunction>(null);
  const extensionsInUseRef = React.useRef<E[]>([]);
  const latestTypeGuardsRef = React.useRef<ExtensionTypeGuard<E>[]>(typeGuards);
  const forceRender = React.useReducer((s: boolean) => !s, false)[1] as VoidFunction;

  const trySubscribe = React.useCallback(() => {
    if (unsubscribeRef.current === null) {
      unsubscribeRef.current = subscribeToExtensions<E>((extensions) => {
        extensionsInUseRef.current = extensions;
        forceRender();
      }, ...latestTypeGuardsRef.current);
    }
  }, [forceRender]);

  const tryUnsubscribe = React.useCallback(() => {
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

  React.useEffect(() => tryUnsubscribe, [tryUnsubscribe]);

  return extensionsInUseRef.current as LoadedExtension<E>[];
};
