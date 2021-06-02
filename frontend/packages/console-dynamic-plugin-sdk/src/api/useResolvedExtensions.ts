import * as React from 'react';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { Extension, ExtensionTypeGuard } from '@console/plugin-sdk/src/typings/base';
import { resolveExtension } from '../coderefs/coderef-resolver';
import { ResolvedExtension } from '../types';
import { unwrapPromiseSettledResults } from '../utils/promise';

/**
 * React hook for consuming Console extensions with resolved `CodeRef` properties.
 *
 * This hook accepts the same argument(s) as `useExtensions` hook and returns an
 * adapted list of extension instances, resolving all code references within each
 * extension's properties.
 *
 * Initially, the hook returns an empty array. Once the resolution is complete,
 * the React component is re-rendered with the hook returning an adapted list of
 * extensions.
 *
 * When the list of matching extensions changes, the resolution is restarted. The
 * hook will continue to return the previous result until the resolution completes.
 *
 * Example usage:
 *
 * ```ts
 * const navItemExtensions = useResolvedExtensions<NavItem>(isNavItem);
 * const [perspectiveExtensions] = useResolvedExtensions<Perspective>(isPerspective);
 * // process adapted extensions and render your component
 * ```
 *
 * The hook's result elements are guaranteed to be referentially stable across re-renders.
 *
 * @param typeGuards Type guard(s) used to narrow the extension instances.
 *
 * @returns Tuple containing a list of adapted extension instances with resolved code
 * references, boolean flag indicating whether the resolution is complete, and a list
 * of errors detected during the resolution.
 */
export const useResolvedExtensions = <E extends Extension>(
  ...typeGuards: ExtensionTypeGuard<E>[]
): [ResolvedExtension<E>[], boolean, any[]] => {
  const extensions = useExtensions<E>(...typeGuards);

  const [resolvedExtensions, setResolvedExtensions] = React.useState<ResolvedExtension<E>[]>([]);
  const [resolved, setResolved] = React.useState<boolean>(false);
  const [errors, setErrors] = React.useState<any[]>([]);

  React.useEffect(() => {
    let disposed = false;

    // The promise returned by Promise.allSettled() never rejects; no need for catch-or-return.
    // eslint-disable-next-line promise/catch-or-return
    Promise.allSettled(
      extensions.map((e) => resolveExtension<typeof e, any, ResolvedExtension<E>>(e)),
    ).then((results) => {
      if (!disposed) {
        const [fulfilledValues, rejectedReasons] = unwrapPromiseSettledResults(results);
        setResolvedExtensions(fulfilledValues);
        setErrors(rejectedReasons);
        setResolved(true);

        if (rejectedReasons.length > 0) {
          // eslint-disable-next-line no-console
          console.error('Detected errors while resolving Console extensions', rejectedReasons);
        }
      }
    });

    return () => {
      disposed = true;
    };
  }, [extensions]);

  return [resolvedExtensions, resolved, errors];
};
