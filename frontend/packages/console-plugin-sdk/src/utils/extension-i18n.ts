import { TFunction } from 'i18next';
import { cloneDeepWith } from 'lodash';
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
 * @see https://github.com/lodash/lodash/blob/dec55b7a3b382da075e2eac90089b4cd00a26cbb/lodash.js#L323
 */
const unclonableTags = {
  '[object Error]': true,
  '[object Function]': true,
  '[object WeakMap]': true,
};

// TODO(CONSOLE-3769): update @openshift/dynamic-plugin-sdk and use the export from there
/** {@link _.clone} but it keeps the existing object references for uncloneable values. */
const cloneExtension = <TExtension extends Extension>(extension: TExtension): TExtension => {
  // Lodash is weird like that
  // eslint-disable-next-line consistent-return
  return cloneDeepWith(extension, (value) => {
    // Do not clone uncloneable values such as functions, DOM nodes, WeakMaps, and Error objects.
    if (unclonableTags[Object.prototype.toString.call(value)]) {
      return value;
    }
  });
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
  const clonedExtension = cloneExtension(extension);

  deepForOwn(clonedExtension, isTranslatableString, (value, key, obj) => {
    obj[key] = t(value);
  });

  return clonedExtension;
};
