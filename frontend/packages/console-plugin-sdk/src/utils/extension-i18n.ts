import { TFunction } from 'i18next';
import { deepForOwn } from '@console/dynamic-plugin-sdk/src/utils/object';
import { Extension } from '../typings';

export const isTranslatableString = (value): value is string => {
  return typeof value === 'string' && /^%.+%$/.test(value);
};

export const translateExtension = <E extends Extension>(extension: E, t: TFunction): E => {
  deepForOwn(extension.properties, isTranslatableString, (stringValue, key, obj) => {
    obj[key] = t(stringValue);
  });

  return extension;
};
