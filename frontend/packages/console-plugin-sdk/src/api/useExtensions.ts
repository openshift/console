import { useExtensions as useExtensionsSDK } from '@openshift/dynamic-plugin-sdk';
import { useSortedExtensions } from '../utils/useSortedExtensions';
import { useTranslatedExtensions } from '../utils/useTranslatedExtensions';

/**
 * React hook for consuming Console extensions which are currently in use.
 *
 * An extension is in use when the associated plugin is currently enabled and its
 * feature flag requirements (if any) are met according to current feature flags.
 *
 * This hook re-renders the component whenever the list of matching extensions changes.
 *
 * The hook's result is guaranteed to be referentially stable across re-renders.
 *
 * @example
 * ```ts
 * const Example = () => {
 *   const navItemExtensions = useExtensions<NavItem>(isNavItem);
 *   // process extensions and render your component
 * };
 * ```
 *
 * @returns List of matching extensions which are currently in use.
 *
 * @see {@link useTranslatedExtensions}
 * @see {@link useSortedExtensions}
 */
// TODO: consider exposing hook via Console plugin SDK and move ^^ doc to exported symbol
export const useExtensions: typeof useExtensionsSDK = (predicate) => {
  const extensions = useExtensionsSDK(predicate);
  const sortedExtensions = useSortedExtensions(extensions);
  const translatedExtensions = useTranslatedExtensions(sortedExtensions);

  return translatedExtensions;
};
