import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { RootState } from '@console/internal/redux';
import { stateToFlagsObject, FlagsObject, FeatureState } from '@console/internal/reducers/features';
import { pluginStore } from '@console/internal/plugins';
import { getGatingFlagNames, isExtensionInUse } from './store';
import { Extension, ExtensionTypeGuard, LoadedExtension } from './typings';

/**
 * React hook for consuming Console extensions.
 *
 * This hook takes extension type guard as its only argument and returns a list
 * of extension instances, narrowed by the given type guard, which are currently
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
 * @param typeGuard Type guard used to narrow the extension type.
 */
export const useExtensions = <E extends Extension>(
  typeGuard: ExtensionTypeGuard<E>,
): LoadedExtension<E>[] => {
  const allExtensions = pluginStore.getAllExtensions();

  // 1) Narrow extensions according to type guard
  const matchedExtensions = React.useMemo(() => allExtensions.filter(typeGuard), [
    allExtensions,
    typeGuard,
  ]);

  // 2) Compute flags relevant for gating matched extensions
  const gatingFlagNames = React.useMemo(() => getGatingFlagNames(matchedExtensions), [
    matchedExtensions,
  ]);
  const gatingFlagSelectorCreator = React.useMemo(
    () =>
      createSelectorCreator(
        defaultMemoize as any,
        (prevFeatureState: FeatureState, nextFeatureState: FeatureState) =>
          gatingFlagNames.every((f) => prevFeatureState.get(f) === nextFeatureState.get(f)),
      ),
    [gatingFlagNames],
  );
  const gatingFlagSelector = React.useMemo(
    () =>
      gatingFlagSelectorCreator(
        (state: RootState) => state.FLAGS,
        (featureState) => stateToFlagsObject(featureState, gatingFlagNames),
      ),
    [gatingFlagSelectorCreator, gatingFlagNames],
  );
  const gatingFlags = useSelector<RootState, FlagsObject>(gatingFlagSelector);

  // 3) Gate matched extensions by relevant feature flags
  const extensionsInUse = React.useMemo(
    () => matchedExtensions.filter((e) => isExtensionInUse(e, gatingFlags)),
    [matchedExtensions, gatingFlags],
  );

  return extensionsInUse as LoadedExtension<E>[];
};
