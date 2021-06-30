import * as React from 'react';
import * as _ from 'lodash';
import { mergeExtensionProperties } from '@console/dynamic-plugin-sdk/src/utils/store';
import { useForceRender } from '@console/shared/src/hooks/useForceRender';
import { Extension, ExtensionTypeGuard, LoadedExtension } from '../typings';
import useTranslationExt from '../utils/useTranslationExt';
import { subscribeToExtensions } from './pluginSubscriptionService';

const translate = (obj: any, t: (str: string) => string): typeof obj => {
  if (typeof obj === 'string') {
    return t(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map((a) => translate(a, t));
  }
  // Check for plain object and ensure it is not a react component.
  // Simple check for react component is sufficient.
  if (_.isPlainObject(obj) && !obj.$$typeof) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = translate(obj[key], t);
      return acc;
    }, {});
  }
  return obj;
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
 *   const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
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

  const forceRender = useForceRender();

  const isMountedRef = React.useRef(true);
  const unsubscribeRef = React.useRef<VoidFunction>(null);
  const extensionsInUseRef = React.useRef<LoadedExtension<E>[]>([]);
  const latestTypeGuardsRef = React.useRef<ExtensionTypeGuard<E>[]>(typeGuards);
  const { t } = useTranslationExt();

  const trySubscribe = React.useCallback(() => {
    if (unsubscribeRef.current === null) {
      unsubscribeRef.current = subscribeToExtensions<E>((extensions) => {
        extensionsInUseRef.current = extensions.map((e) =>
          mergeExtensionProperties(e, translate(e.properties, t)),
        );
        isMountedRef.current && forceRender();
      }, ...latestTypeGuardsRef.current);
    }
  }, [forceRender, t]);

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

  React.useEffect(
    () => () => {
      isMountedRef.current = false;
      tryUnsubscribe();
    },
    [tryUnsubscribe],
  );

  return extensionsInUseRef.current;
};
