import * as React from 'react';
import { TFunction } from 'i18next';
import { Extension, LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { isTranslatableString, translateExtensionDeep } from './extension-i18n';
import useTranslationExt from './useTranslationExt';

/**
 * `translateExtensionDeep` mutates the extension for translations. We need to store a
 * semi-permanent mapping of the translation keys values.
 *
 * Structured as: { [extension.UID]: { [propertyPathToTranslation]: translationKey } }
 */
const translationKeyMap: Record<string, Record<string, string>> = {};

const useTranslatedExtensions = <E extends Extension>(
  extensions: LoadedExtension<E>[],
): typeof extensions => {
  const { t } = useTranslationExt();
  // TODO: Drop ref and start using useEffect when we are not mutating extensions
  const lastTRef = React.useRef<TFunction>(null);

  if (t !== lastTRef.current) {
    extensions.forEach((e) => {
      const UID = e.uid;
      translateExtensionDeep(
        e,
        (value, path): value is string => {
          let translatableString = value;
          if (translationKeyMap[UID]?.[path]) {
            translatableString = translationKeyMap[UID][path];
          }
          return isTranslatableString(translatableString);
        },
        (value, key, obj, path) => {
          if (!translationKeyMap[UID]) {
            translationKeyMap[UID] = {};
          }
          if (!translationKeyMap[UID][path]) {
            translationKeyMap[UID][path] = value;
          }
          // TODO: Fix mutation of extension - mirrors work done in translateExtension
          // @see translateExtension()
          obj[key] = t(translationKeyMap[UID][path]);
        },
      );
    });
    lastTRef.current = t;
  }

  return extensions;
};

export default useTranslatedExtensions;
