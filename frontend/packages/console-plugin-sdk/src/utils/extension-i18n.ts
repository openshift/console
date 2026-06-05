import { cloneDeepOnlyCloneableValues } from '@openshift/dynamic-plugin-sdk';
import type { TFunction } from 'i18next';
import type { ConsoleTFunction } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { Extension } from '@console/dynamic-plugin-sdk/src/types';
import { deepForOwn } from '@console/dynamic-plugin-sdk/src/utils/object';

const NS_SEPARATOR = '~';

export const isTranslatableString = (value): value is string => {
  return (
    typeof value === 'string' && value.length > 2 && value.startsWith('%') && value.endsWith('%')
  );
};

export const getTranslationKey = (value: string) =>
  isTranslatableString(value) ? value.substr(1, value.length - 2) : undefined;

/**
 * Collects the unique i18next namespaces referenced by translatable strings across all
 * extensions. Useful for passing to `useTranslation(ns)` so Suspense waits for them.
 */
export const getNamespacesFromExtensions = <TExtension extends Extension>(
  extensions: TExtension[],
): string[] => {
  const namespaces = new Set<string>();
  extensions.forEach((extension) => {
    deepForOwn(extension, isTranslatableString, (value) => {
      const key = getTranslationKey(value);
      if (key) {
        const separatorIndex = key.indexOf(NS_SEPARATOR);
        if (separatorIndex > 0) {
          namespaces.add(key.substring(0, separatorIndex));
        }
      }
    });
  });
  return Array.from(namespaces);
};

/**
 * Recursively updates the extension's properties, replacing all `%key%` placeholders within
 * string values using the provided `t` function.
 *
 * Returns a new extension instance; its `properties` object is cloned in order to preserve
 * the original extension.
 */
export const translateExtension = <TExtension extends Extension>(
  extension: TExtension,
  t: ConsoleTFunction | TFunction,
): TExtension => {
  const clonedExtension = cloneDeepOnlyCloneableValues(extension);

  deepForOwn(clonedExtension, isTranslatableString, (value, key, obj) => {
    obj[key] = t(value);
  });

  return clonedExtension;
};
