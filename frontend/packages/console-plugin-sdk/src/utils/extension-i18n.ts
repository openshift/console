import { cloneDeepOnlyCloneableValues } from '@openshift/dynamic-plugin-sdk';
import type { TFunction } from 'i18next';
import type { ConsoleTFunction } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { Extension } from '@console/dynamic-plugin-sdk/src/types';
import { deepForOwn } from '@console/dynamic-plugin-sdk/src/utils/object';

export const isTranslatableString = (value): value is string => {
  return (
    typeof value === 'string' && value.length > 2 && value.startsWith('%') && value.endsWith('%')
  );
};

export const getTranslationKey = (value: string) =>
  isTranslatableString(value) ? value.substr(1, value.length - 2) : undefined;

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
