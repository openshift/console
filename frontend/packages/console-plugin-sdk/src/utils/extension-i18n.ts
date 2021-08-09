import { TFunction } from 'i18next';
import { deepForOwn } from '@console/dynamic-plugin-sdk/src/utils/object';
import { Extension } from '../typings';

export const isTranslatableString = (value): value is string => {
  return (
    typeof value === 'string' && value.length > 2 && value.startsWith('%') && value.endsWith('%')
  );
};

export const getTranslationKey = (value: string) =>
  isTranslatableString(value) ? value.substr(1, value.length - 2) : undefined;

/**
 * Recursively updates the extension's properties, replacing all translatable string values
 * via the provided `t` function.
 */
export const translateExtension = <E extends Extension>(extension: E, t: TFunction): E => {
  deepForOwn(extension.properties, isTranslatableString, (value, key, obj) => {
    obj[key] = t(value);
  });

  return extension;
};
