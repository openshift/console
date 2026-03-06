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
 * The hook's result is guaranteed to be referentially stable across re-renders,
 * assuming referential stability of the `predicate` parameter.
 *
 * @example
 * ```ts
 * const Example = () => {
 *   const navItems = useExtensions(isNavItem);
 *   // process extensions and render your component
 * };
 * ```
 *
 * @returns List of matching extensions which are currently in use.
 *
 * @see {@link useTranslatedExtensions}
 * @see {@link useSortedExtensions}
 */
export const useExtensions: typeof useExtensionsSDK = (predicate) => {
  const extensions = useExtensionsSDK(predicate);
  const sortedExtensions = useSortedExtensions(extensions);
  const translatedExtensions = useTranslatedExtensions(sortedExtensions);

  return translatedExtensions;
};
