import * as React from 'react';
import * as _ from 'lodash';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import {
  Extension,
  ExtensionTypeGuard,
  LoadedExtension,
} from '@console/plugin-sdk/src/typings/base';
import { resolveCodeRefProperties } from '../coderefs/coderef-resolver';
import {
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
): ResolvedExtension<E>[] => {
  const extensions = useExtensions<E>(...typeGuards);

  const [resolvedExtensions, setResolvedExtensions] = React.useState<ResolvedExtension<E>[]>([]);

  React.useEffect(() => {
    let disposed = false;

    // eslint-disable-next-line promise/catch-or-return
    Promise.all(
      extensions.map(async (e) => {
        const properties = await resolveCodeRefProperties(e);
        return Object.freeze(_.merge({}, e, { properties })) as ResolvedExtension<E>;
      }),
    ).then((result) => {
      if (!disposed) {
        setResolvedExtensions(result);
      }
    });

    return () => {
      disposed = true;
    };
  }, [extensions]);

  return resolvedExtensions;
};

type ResolvedExtension<E extends Extension, P = ExtensionProperties<E>> = UpdateExtensionProperties<
  LoadedExtension<E>,
  ResolvedCodeRefProperties<P>
>;
