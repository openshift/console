import { useMemo } from 'react';
import type { Extension, LoadedExtension } from '@openshift/dynamic-plugin-sdk';
import { translateExtension } from './extension-i18n';
import useTranslationExt from './useTranslationExt';

/**
 * In each extension's `properties` object, replace `%key%` placeholders within string values
 * with actual translations.
 *
 * This hook returns a deep copy of original extension objects, see {@link translateExtension}
 * for details.
 *
 * The hook assumes that `extensions` array is referentially stable across re-renders.
 *
 * @returns List of translated extensions.
 */
export const useTranslatedExtensions = <TExtension extends Extension>(
  extensions: LoadedExtension<TExtension>[],
) => {
  const { t } = useTranslationExt();

  return useMemo(() => extensions.map((e) => translateExtension(e, t)), [extensions, t]);
};
