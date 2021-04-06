import * as React from 'react';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { mergeExtensionProperties } from '@console/plugin-sdk/src/store';
import { resolveCodeRefProperties } from '../coderefs/coderef-resolver';
import {
  Extension,
  ExtensionTypeGuard,
  LoadedExtension,
  ResolvedCodeRefProperties,
  ExtensionProperties,
  UpdateExtensionProperties,
} from '../types';

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
 * const perspectiveExtensions = useResolvedExtensions<Perspective>(isPerspective);
 * // process adapted extensions and render your component
 * ```
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 *
 * @param typeGuards Type guard(s) used to narrow the extension instances.
 *
 * @returns List of adapted extension instances with resolved code references.
 */
export const useResolvedExtensions = <E extends Extension>(
  ...typeGuards: ExtensionTypeGuard<E>[]
): [ResolvedExtension<E>[], boolean, any] => {
  const extensions = useExtensions<E>(...typeGuards);

  const [resolvedExtensions, setResolvedExtensions] = React.useState<ResolvedExtension<E>[]>([]);
  const [resolved, setResolved] = React.useState<boolean>(false);
  const [error, setError] = React.useState<any>(undefined);

  React.useEffect(() => {
    let disposed = false;

    Promise.all(
      extensions.map(async (e) => {
        const resolvedProperties = await resolveCodeRefProperties(e);
        return mergeExtensionProperties(e, resolvedProperties) as ResolvedExtension<E>;
      }),
    )
      .then((result) => {
        if (!disposed) {
          setResolvedExtensions(result);
          setResolved(true);
        }
      })
      .catch((err) => {
        if (!disposed) {
          setError(err);
        }
      });

    return () => {
      disposed = true;
    };
  }, [extensions]);

  return [resolvedExtensions, resolved, error];
};

export type ResolvedExtension<E extends Extension, P = ExtensionProperties<E>> = LoadedExtension<
  UpdateExtensionProperties<E, ResolvedCodeRefProperties<P>>
>;
